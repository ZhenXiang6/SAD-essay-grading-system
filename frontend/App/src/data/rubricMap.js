// src/data/rubricMap.js
// 評分標準

export const rubricMap = {
    "擬社會互動的特徵與影響": {
        // 114-學測
        description: "題目說明：第一小題占 4 分（80 字內），第二小題占 21 分（400 字內），共 25 分。",
        total: 25,
        parts: [
            {
                partTitle: "第一小題",
                weight: 4,
                criteria: [
                    { grade: "A", scoreRange: "4-3", description: "能確切說明「擬社會互動」的特徵，內容完整，表達清晰。", },
                    { grade: "B", scoreRange: "2", description: "能大致說明「擬社會互動」的特徵，內容不夠完整。", },
                    { grade: "C", scoreRange: "1", description: "解釋錯誤，敘述混亂。", },
                    { grade: "0", scoreRange: "0", description: "空白卷、文不對題、或僅抄錄題幹。", },
                ],
            },
            {
                partTitle: "第二小題",
                weight: 21,
                criteria: [
                    { grade: "A+", scoreRange: "21-19", description: "能闡述擬社會互動的正、負面影響，言之有物，論點明確，證據深入，結構嚴謹，層次井然，文辭暢達。", },
                    { grade: "A", scoreRange: "18-15", description: "能闡述擬社會互動的正、負面影響，結構允當，條理分明，文辭流暢。", },
                    { grade: "B+", scoreRange: "14-12", description: "大致能闡述擬社會互動的正、負面影響，論述尚稱適當，結構合宜，文辭通順。", },
                    { grade: "B", scoreRange: "11-8", description: "大致能闡述擬社會互動的正、負面影響，但論述平平，文辭尚稱通順。", },
                    { grade: "C+", scoreRange: "7-5", description: "觀點敘述不清，結構鬆散，文辭欠通順。", },
                    { grade: "C", scoreRange: "4-1", description: "立論含糊，敘寫雜亂，文辭不通。", },
                    { grade: "0", scoreRange: "0", description: "空白卷、文不對題、或僅抄錄題幹。", },
                ],
            },
        ],
    },
    "標籤概念與現象看法": {
        // 113-學測
        description: "第一小題說明「標籤」概念於人身上的正負面作用；第二小題透過生活中實例說明對「標籤現象」的看法，總分 25 分（4 分 + 21 分）。",
        total: 25,
        parts: [
            {
                partTitle: "第一小題",
                weight: 4,
                criteria: [
                    {
                        grade: "A",
                        scoreRange: "4-3",
                        description: "能確切說明標籤正面與負面作用，敘述完整，表達清晰。"
                    },
                    {
                        grade: "B",
                        scoreRange: "2",
                        description: "僅能略為說明正面與負面作用，文字欠周延。"
                    },
                    {
                        grade: "C",
                        scoreRange: "1",
                        description: "略涉題旨，無法清楚說明正負面作用。"
                    },
                    {
                        grade: "0",
                        scoreRange: "0",
                        description: "空白卷、文不對題，或僅抄錄題幹。"
                    }
                ]
            },
            {
                partTitle: "第二小題",
                weight: 21,
                criteria: [
                    {
                        grade: "A+",
                        scoreRange: "21-19",
                        description: "能以適切事例，完整表達對標籤現象的看法，論點明確，詮釋深入，結構嚴謹，文辭暢達。"
                    },
                    {
                        grade: "A",
                        scoreRange: "18-15",
                        description: "能具體表述對標籤現象的觀點，結構允當，條理分明，文辭流暢。"
                    },
                    {
                        grade: "B+",
                        scoreRange: "14-12",
                        description: "能表述對標籤現象的觀點，論述尚稱適當，結構合宜，文辭通順。"
                    },
                    {
                        grade: "B",
                        scoreRange: "11-8",
                        description: "能大致表述對標籤現象的觀點，但論述平平，文辭尚稱通順。"
                    },
                    {
                        grade: "C+",
                        scoreRange: "7-5",
                        description: "稍涉題旨，觀點敘述不清，結構鬆散，文辭欠通順。"
                    },
                    {
                        grade: "C",
                        scoreRange: "4-1",
                        description: "立論含糊，敘寫雜亂，文辭不通。"
                    },
                    {
                        grade: "0",
                        scoreRange: "0",
                        description: "空白卷、文不對題，或僅抄錄題幹。"
                    }
                ]
            }
        ]
    },
    "福爾摩斯與華生生活態度分析": {
        // 112-學測
        description: "第一小題分析福爾摩斯立場指出兩個錯誤；第二小題分析兩人生活態度差異並表明自身傾向，共 25 分（4 分 + 21 分）。",
        total: 25,
        parts: [
            {
                partTitle: "第一小題",
                weight: 4,
                criteria: [
                    {
                        grade: "A",
                        scoreRange: "4-3",
                        description: "能確切分析兩個錯誤，文字流暢，內容完整。"
                    },
                    {
                        grade: "B",
                        scoreRange: "2",
                        description: "能大致掌握兩個錯誤，內容不夠完整。"
                    },
                    {
                        grade: "C",
                        scoreRange: "1",
                        description: "未能掌握兩個錯誤，解讀有誤，敘述混亂。"
                    },
                    {
                        grade: "0",
                        scoreRange: "0",
                        description: "空白卷、文不對題、或僅抄錄題幹。"
                    }
                ]
            },
            {
                partTitle: "第二小題",
                weight: 21,
                criteria: [
                    {
                        grade: "A+",
                        scoreRange: "21-19",
                        description: "能分析二人生活態度差異，立場清楚，論述深刻，文辭洗練，且具思辨深度。"
                    },
                    {
                        grade: "A",
                        scoreRange: "18-15",
                        description: "能分析二人生活態度差異，立場清楚，條理分明，論述清晰，文辭暢達。"
                    },
                    {
                        grade: "B+",
                        scoreRange: "14-12",
                        description: "大致能分析二人生活態度差異，並表達立場，論述合理，文辭得宜。"
                    },
                    {
                        grade: "B",
                        scoreRange: "11-8",
                        description: "大致能分析二人生活態度差異，但立場表達模糊，論述尚稱合理，文辭平順。"
                    },
                    {
                        grade: "C+",
                        scoreRange: "7-5",
                        description: "未能分析兩人生活態度差異，論述空泛，文辭欠通順。"
                    },
                    {
                        grade: "C",
                        scoreRange: "4-1",
                        description: "未分析兩人生活態度差異，論述雜亂，文句不通。"
                    },
                    {
                        grade: "0",
                        scoreRange: "0",
                        description: "空白卷、文不對題、或僅抄錄題幹。"
                    }
                ]
            }
        ]
    },
    "不老騎士與樂齡出遊": {
        description: "第一小題說明活動內容的關鍵差異與用意；第二小題說明『樂齡出遊』的意義，並考量長者需求，共 25 分（4 分 + 21 分）。",
        total: 25,
        parts: [
            {
                partTitle: "第一小題",
                weight: 4,
                criteria: [
                    {
                        grade: "A",
                        scoreRange: "4-3",
                        description: "能確切說明兩者活動內容的關鍵差異與用意，敘述完整，表達清晰。"
                    },
                    {
                        grade: "B",
                        scoreRange: "2",
                        description: "僅能略述二者差異或用意，文字欠周延。"
                    },
                    {
                        grade: "C",
                        scoreRange: "1",
                        description: "略涉題旨，但無法分辨二者差異與用意。"
                    },
                    {
                        grade: "0",
                        scoreRange: "0",
                        description: "空白卷、文不對題，或僅抄錄題幹。"
                    }
                ]
            },
            {
                partTitle: "第二小題",
                weight: 21,
                criteria: [
                    {
                        grade: "A+",
                        scoreRange: "21-19",
                        description: "能適切說明『樂齡出遊』的意義，並考量長者的生理與情感需求，結構嚴謹、條理分明，充分引經據典、文辭精練、詞藻相當華麗。"
                    },
                    {
                        grade: "A",
                        scoreRange: "18-15",
                        description: "具體說明『樂齡出遊』的意義，並考量長者需求，條理有序，文辭暢達，稍微引經據典、詞藻華麗。"
                    },
                    {
                        grade: "B+",
                        scoreRange: "14-12",
                        description: "能說明『樂齡出遊』的意義，並考量長者生理或情感需求，表達清楚，文辭得宜。"
                    },
                    {
                        grade: "B",
                        scoreRange: "11-8",
                        description: "能大致說明『樂齡出遊』的意義，思考長者需求，表述大致合理，文辭平順。"
                    },
                    {
                        grade: "C+",
                        scoreRange: "7-5",
                        description: "稍涉題旨，敘述空泛，文辭拙劣。"
                    },
                    {
                        grade: "C",
                        scoreRange: "4-1",
                        description: "混淆題旨，敘述雜亂，文句不通。"
                    },
                    {
                        grade: "0",
                        scoreRange: "0",
                        description: "空白卷、文不對題，或僅抄錄題幹。"
                    }
                ]
            }
        ]
    },
    "忘情診所與經驗機器": {
    // 110-學測
        description: "說明『忘情診所』與『健忘村』刪除記憶劇情的差異，並說明對『經驗機器』上市的立場。合併評分，滿分 25 分。",
        total: 25,
        parts: [
            {
                partTitle: "綜合評分（兩小題合併）",
                weight: 25,
                criteria: [
                    {
                        grade: "A+",
                        scoreRange: "22-25",
                        description: "能確切說明『忘情診所』與『健忘村』記憶刪除差異，且清楚表明對『經驗機器』上市的立場，觀點深入切當，論述嚴謹，敘述完整，表達清晰，文辭精練。"
                    },
                    {
                        grade: "A",
                        scoreRange: "18-21",
                        description: "觀點切當，條理分明，文辭暢達，論述完整清楚。"
                    },
                    {
                        grade: "B+",
                        scoreRange: "14-17",
                        description: "說明記憶刪除差異不夠完整，且立場觀點明確，論述合理，文辭通順。"
                    },
                    {
                        grade: "B",
                        scoreRange: "10-13",
                        description: "論述大致合理，文辭尚稱通順，偶有瑕疵。"
                    },
                    {
                        grade: "C+",
                        scoreRange: "6-9",
                        description: "說明差異不準確，立場不清，敘述空泛，文辭欠通順。"
                    },
                    {
                        grade: "C",
                        scoreRange: "1-5",
                        description: "敘述雜亂，文句不通。"
                    },
                    {
                        grade: "0",
                        scoreRange: "0",
                        description: "空白卷、文不對題、或僅抄錄題幹。"
                    }
                ]
            }
        ]
    }
};
