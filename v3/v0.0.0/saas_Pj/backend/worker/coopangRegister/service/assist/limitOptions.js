/**
 * variants를 maxOptionCount만큼 제한하고 불필요한 옵션값을 제거합니다.
 * 
 * @param {Object} jsonData - 원본 JSON 데이터 (structure.md의 getBaseData 출력 구조)
 * @param {number} maxOptionCount - 최대 옵션 개수
 * @returns {Object} 제한된 variants와 정리된 optionSchema를 포함한 새로운 jsonData
 */
export function limitOptionsData(jsonData, maxOptionCount) {
    try {
        // 깊은 복사로 원본 데이터 보존
        const limitedJsonData = JSON.parse(JSON.stringify(jsonData));
        
        // 1. variants를 maxOptionCount만큼 제한
        if (limitedJsonData.variants && Array.isArray(limitedJsonData.variants)) {
            limitedJsonData.variants = limitedJsonData.variants.slice(0, maxOptionCount);
        }
        
        // 2. 제한된 variants에서 실제로 사용되는 optionId와 valueId 조합 추출
        const usedOptionValuePairs = new Set();
        
        limitedJsonData.variants.forEach(variant => {
            if (variant.optionCombination && Array.isArray(variant.optionCombination)) {
                variant.optionCombination.forEach(option => {
                    if (option.optionId && option.valueId) {
                        usedOptionValuePairs.add(`${option.optionId}-${option.valueId}`);
                    }
                });
            }
        });
        
        
        // 3. optionSchema에서 실제로 사용되지 않는 optionValues 제거
        if (limitedJsonData.optionSchema && Array.isArray(limitedJsonData.optionSchema)) {
            const filteredOptionSchema = [];
            
            limitedJsonData.optionSchema.forEach(option => {
                if (!option.optionId || !option.optionValues || !Array.isArray(option.optionValues)) {
                    return; // 유효하지 않은 옵션은 건너뜀
                }
                
                // 이 옵션에서 실제로 사용되는 optionValues만 필터링
                const usedOptionValues = option.optionValues.filter(optionValue => {
                    if (!optionValue.valueId) return false;
                    return usedOptionValuePairs.has(`${option.optionId}-${optionValue.valueId}`);
                });
                
                // 사용되는 optionValues가 있다면 옵션을 포함
                if (usedOptionValues.length > 0) {
                    filteredOptionSchema.push({
                        ...option,
                        optionValues: usedOptionValues
                    });
                }
            });
            
            limitedJsonData.optionSchema = filteredOptionSchema;
            

        }
        
        return limitedJsonData;
        
    } catch (error) {
        console.error('[limitOptions] 옵션 제한 처리 중 오류 발생:', error);
        throw error;
    }
}
