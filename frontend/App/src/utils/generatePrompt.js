// src/utils/generatePrompt.js

export function generatePrompt(promptTitle, rubric, studentText) {
  const rubricText = rubric.parts.map((part) => {
    const criteriaText = part.criteria.map((c) =>
      `- ${c.grade}（${c.scoreRange}分）：${c.description}`
    ).join("\n");

    return `【${part.partTitle}】（占 ${part.weight} 分）評分標準如下，請只從中選擇最適合的等第與分數範圍：\n${criteriaText}`;
  }).join("\n\n");

  return `
    你是一位專業的國文作文評分助教。請依照下列題目與評分標準，對學生的每一小題作文進行**逐項評分**，嚴格根據所提供的等第與分數範圍給出結果，並提供每一小題的理由。**禁止自由創造等第、分數或格式**。

    請使用以下格式回傳（JSON 格式，且不得有多餘文字）：
    {
      "total": 總分（第一小題與第二小題的分數總和，滿分為 ${rubric.total}）,
      "parts": [
        {
          "part": "第一小題",
          "grade": "等第（只能從評分標準中擇一，如 A、B、C+ 等）",
          "score": 整數（請使用評分標準中的分數範圍中任一整數）,
          "reason": "簡潔說明為何給出此等第與分數，限 1~2 句。"
        },
        {
          "part": "第二小題",
          "grade": "同上",
          "score": 整數,
          "reason": "同上"
        }
      ],
      "grammar_analysis": {
        "score": 整數，滿分 10 分,
        "comment": "針對文法分析的簡短評語"
      },
      "vocabulary_usage": {
        "score": 整數，滿分 10 分,
        "comment": "針對詞彙使用的簡短評語"
      },
      "structure_issues": {
        "score": 整數，滿分 10 分,
        "comment": "針對文章結構問題的簡短評語"
      },
      "summary": "整體評論，限 2~3 句，請簡明指出優點與可改善處。"
    }

    ⚠️ 請特別注意：
    - 不可輸出任何額外說明或 markdown
    - 所有等第與分數，**只能從下列評分標準中選擇，不可自創**
    - 若格式錯誤，將視為評分失敗
    - 字數不到100字也請給偏低的評分
    - 字數不到100字的話grammar_analysis, vocabulary_usage, structure_issues都給很低分
    

    作文題目：「${promptTitle}」

    ${rubricText}

    以下是學生作文內容：

    ${studentText}
    `.trim();
}