export class ProductTracker {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.views = {}; // 메모리에 저장되는 조회수
    
    // 시작 시 스토리지에서 메모리 상태 복원
    this.state.blockConcurrencyWhile(async () => {
      const storedViews = await this.state.storage.get('views');
      if (storedViews) {
        this.views = storedViews;
      }
    });
  }

  // 메인 워커로부터의 fetch 요청 처리
  async fetch(request) {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const productId = url.searchParams.get('productId');
    const groupId = url.searchParams.get('groupId');
    const market = url.searchParams.get('market');

    if (!userId || !productId || !groupId || !market) {
      return new Response('Missing required parameters', { status: 400 });
    }
    
    // 알람에 사용할 ID를 개별적으로 저장
    await this.state.storage.put('userId', userId);
    await this.state.storage.put('productId', productId);
    await this.state.storage.put('groupId', groupId);

    // 메모리 내 조회수 증가
    this.views[market] = (this.views[market] || 0) + 1;
    this.views['total'] = (this.views['total'] || 0) + 1;

    // 메모리 상태를 스토리지에도 저장
    await this.state.storage.put('views', this.views);

    // 알람이 설정되지 않은 경우 데이터 저장을 위한 알람 설정
    const currentAlarm = await this.state.storage.getAlarm();
    if (currentAlarm === null) {
      // 프로덕션 환경: 5분으로 설정
      const fiveMinutes = 1 * 6 * 1000;
      const alarmTime = Date.now() + fiveMinutes;
      await this.state.storage.setAlarm(alarmTime);
    }

    return new Response('Tracked', { status: 200 });
  }

  // fetch()에서 설정된 알람이 울릴 때 호출되는 메서드
  async alarm() {
    const userId = await this.state.storage.get('userId');
    const productId = await this.state.storage.get('productId');
    const groupId = await this.state.storage.get('groupId');
    const storedViews = await this.state.storage.get('views');
    
    // 스토리지에서 복원
    if (storedViews && Object.keys(this.views).length === 0) {
      this.views = storedViews;
    }
    
    if (!userId || !productId || !groupId || Object.keys(this.views).length === 0) {
        return;
    }
    
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const viewsToCommit = this.views;
    this.views = {};

    const markets = ['cou', 'nav', 'ele', 'acu', 'gma'];
    const viewEntries = markets.map(m => viewsToCommit[m] || 0);
    const totalViews = viewsToCommit['total'] || 0;

    const statement = `
      INSERT INTO product_views (userId, date, productId, groupId, cou_views, nav_views, ele_views, acu_views, gma_views, total_views)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(userId, date, productId) DO UPDATE SET
        cou_views = cou_views + excluded.cou_views,
        nav_views = nav_views + excluded.nav_views,
        ele_views = ele_views + excluded.ele_views,
        acu_views = acu_views + excluded.acu_views,
        gma_views = gma_views + excluded.gma_views,
        total_views = total_views + excluded.total_views;
    `;

    try {
        await this.env.DB.prepare(statement).bind(userId, today, productId, groupId, ...viewEntries, totalViews).run();
        
        // 성공적으로 저장되었으면 스토리지에서 views 삭제
        await this.state.storage.delete('views');
        
    } catch (e) {
        console.error('D2 write failed:', e.message);
        // DB 쓰기 실패 시 데이터 손실을 막기 위해 조회수 복원.
        this.views = viewsToCommit;
        await this.state.storage.put('views', this.views);
        // 나중에 다시 시도하도록 알람 재설정
        await this.state.storage.setAlarm(Date.now() + 60 * 1000); // 1분 후에 다시 시도
    }
  }
} 