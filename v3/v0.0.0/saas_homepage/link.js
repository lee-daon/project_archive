document.addEventListener('DOMContentLoaded', () => {
  // 도메인 설정을 변수로 관리하여 한번에 변경할 수 있도록 합니다.
  const appDomain = 'https://example.com';

  // 연락처 정보
  const contactInfo = {
    kakaoChannel: '@루프톤',
    kakaoUrl: 'https://example.com/kakao',
    email: 'contact@loofton.com',
    phone: '070-1234-5678 (평일 10:00-18:00)',
  };

  // 링크 매핑 객체: 여기서 URL과 새 탭 열기 여부를 함께 관리합니다.
  const linkMappings = {
    // 회원가입 관련 버튼
    'gnb-signup-btn': { url: `${appDomain}/login`, newTab: false },
    'hero-signup-btn': { url: `${appDomain}/login`, newTab: false },
    'final-cta-signup-btn': { url: `${appDomain}/login`, newTab: false },

    // 로그인 버튼
    'gnb-login-btn': { url: `${appDomain}/login`, newTab: false },
    
    // 메인 로고
    'logo-link': { url: `${appDomain}/`, newTab: false },
    
    // GNB 네비게이션 링크
    'guide-youtube-link': { url: 'https://youtube.com/your-channel', newTab: true },
    'guide-docs-link': { url: 'https://catnip-ruby-a63.notion.site/21561ebafb1d80f49c97f5ee356f46be', newTab: true },
    'plan-link': { url: `${appDomain}/user/payment`, newTab: false },
    'contact-link': { url: `https://example.com/contact`, newTab: false },

    // 가이드
    'guide-link-btn': { url: "https://catnip-ruby-a63.notion.site/21561ebafb1d80f49c97f5ee356f46be", newTab: false },
    
    // 핵심 기능 상세 링크 (새 탭에서 열림)
    'feature-link-1': { url: 'https://catnip-ruby-a63.notion.site/22061ebafb1d8035a2e0e64ef49a1507', newTab: true },
    'feature-link-2': { url: 'https://catnip-ruby-a63.notion.site/AI-22b61ebafb1d80acbcafc99e256b871c', newTab: true },
    'feature-link-3': { url: 'https://catnip-ruby-a63.notion.site/seo-22b61ebafb1d8046ba52d2aebad92a21', newTab: true },
    'feature-link-5': { url: 'https://catnip-ruby-a63.notion.site/22e61ebafb1d80e4ae13e349faa11ff4', newTab: true },
    
    // 푸터 링크
    'kakao-channel-link': { url: contactInfo.kakaoUrl, newTab: false },
    'terms-link': { url: './terms.html', newTab: false },
    'privacy-policy-link': { url: './privacy.html', newTab: false },
  };

  // --- DOM에 정보 주입 ---
  const kakaoElement = document.getElementById('kakao-channel-link');
  if (kakaoElement) {
    kakaoElement.textContent = contactInfo.kakaoChannel;
  }

  const emailElement = document.getElementById('email-link');
  if (emailElement) {
    emailElement.href = `mailto:${contactInfo.email}`;
    emailElement.textContent = contactInfo.email;
  }

  const phoneElement = document.getElementById('phone-info');
  if (phoneElement) {
    phoneElement.textContent = contactInfo.phone;
  }

  // --- 이벤트 리스너 할당 ---
  for (const id in linkMappings) {
    const element = document.getElementById(id);
    if (element) {
      const { url, newTab } = linkMappings[id];
      element.addEventListener('click', (event) => {
        // 기본 동작을 막습니다.
        event.preventDefault();
        
        // newTab 속성에 따라 동작을 분기합니다.
        if (newTab) {
          window.open(url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = url;
        }
      });
    }
  }
});
