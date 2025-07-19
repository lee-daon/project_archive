import { parseStringPromise } from 'xml2js';
import iconv from 'iconv-lite';

/**
 * 11번가 출고지 주소 조회
 */
export async function getOutboundAddress(apiKey) {
  try {
    const response = await fetch('http://api.11st.co.kr/rest/areaservice/outboundarea', {
      method: 'GET',
      headers: {
        'openapikey': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // euc-kr 인코딩 처리
    const buffer = await response.arrayBuffer();
    const xmlData = iconv.decode(Buffer.from(buffer), 'euc-kr');
    
    const jsonData = await parseStringPromise(xmlData);
    
    // XML 구조 파싱
    const addresses = jsonData['ns2:inOutAddresss']?.['ns2:inOutAddress'] || [];
    
    // result_message가 없어도 데이터가 있으면 성공으로 간주
    if (!addresses || addresses.length === 0) {
      throw new Error('주소 데이터가 없습니다.');
    }

    // 데이터 가공
    const processedAddresses = Array.isArray(addresses) ? addresses : [addresses];
    const outboundAddresses = processedAddresses.map(addr => ({
      addrSeq: addr.addrSeq?.[0],
      addrNm: addr.addrNm?.[0],
      addr: addr.addr?.[0],
      rcvrNm: addr.rcvrNm?.[0],
      gnrlTlphnNo: addr.gnrlTlphnNo?.[0],
      prtblTlphnNo: addr.prtblTlphnNo?.[0],
      memNo: addr.memNo?.[0]
    }));

    return {
      success: true,
      data: outboundAddresses,
      message: '출고지 주소 조회 성공'
    };

  } catch (error) {
    console.error('11번가 출고지 조회 오류:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}

/**
 * 11번가 반품/교환지 주소 조회
 */
export async function getInboundAddress(apiKey) {
  try {
    const response = await fetch('http://api.11st.co.kr/rest/areaservice/inboundarea', {
      method: 'GET',
      headers: {
        'openapikey': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // euc-kr 인코딩 처리
    const buffer = await response.arrayBuffer();
    const xmlData = iconv.decode(Buffer.from(buffer), 'euc-kr');
    
    const jsonData = await parseStringPromise(xmlData);
    
    // XML 구조 파싱
    const addresses = jsonData['ns2:inOutAddresss']?.['ns2:inOutAddress'] || [];
    
    // result_message가 없어도 데이터가 있으면 성공으로 간주
    if (!addresses || addresses.length === 0) {
      throw new Error('주소 데이터가 없습니다.');
    }

    // 데이터 가공
    const processedAddresses = Array.isArray(addresses) ? addresses : [addresses];
    const inboundAddresses = processedAddresses.map(addr => ({
      addrSeq: addr.addrSeq?.[0],
      addrNm: addr.addrNm?.[0],
      addr: addr.addr?.[0],
      rcvrNm: addr.rcvrNm?.[0],
      gnrlTlphnNo: addr.gnrlTlphnNo?.[0],
      prtblTlphnNo: addr.prtblTlphnNo?.[0],
      memNo: addr.memNo?.[0]
    }));

    return {
      success: true,
      data: inboundAddresses,
      message: '반품/교환지 주소 조회 성공'
    };

  } catch (error) {
    console.error('11번가 반품지 조회 오류:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}

/**
 * 11번가 발송마감 템플릿 조회
 */
export async function getSendCloseList(apiKey) {
  try {
    const response = await fetch('http://api.11st.co.kr/rest/prodservices/sendCloseList', {
      method: 'GET',
      headers: {
        'openapikey': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // euc-kr 인코딩 처리
    const buffer = await response.arrayBuffer();
    const xmlData = iconv.decode(Buffer.from(buffer), 'euc-kr');
    
    const jsonData = await parseStringPromise(xmlData);
    
    // XML 구조 파싱
    const templates = jsonData['productInformationTemplateList']?.['templateBOList'] || [];
    
    // result_message가 없어도 데이터가 있으면 성공으로 간주
    if (!templates || templates.length === 0) {
      throw new Error('발송마감 템플릿 데이터가 없습니다.');
    }

    // 데이터 가공 (필요한 필드만 반환)
    const processedTemplates = Array.isArray(templates) ? templates : [templates];
    const sendCloseTemplates = processedTemplates.map(template => ({
      prdInfoTmpltNo: template.prdInfoTmpltNo?.[0],
      prdInfoTmpltNm: template.prdInfoTmpltNm?.[0]
    }));

    return {
      success: true,
      data: sendCloseTemplates,
      message: '발송마감 템플릿 조회 성공'
    };

  } catch (error) {
    console.error('11번가 발송마감 템플릿 조회 오류:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}
