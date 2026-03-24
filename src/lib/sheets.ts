/**
 * Google Sheets公開URLからCSVデータを取得・パースするユーティリティ
 *
 * スプレッドシートは「リンクを知っている全員が閲覧可」に設定されている必要があります。
 * APIキー不要で動作します。
 */

/** スプレッドシートURLからIDを抽出 */
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/** CSV文字列をパースして行オブジェクトの配列に変換 */
export function parseCsv(csv: string): Record<string, string>[] {
  const lines = csv.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

/** CSV行をパース（ダブルクォート対応） */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

/** Google SheetsからCSVデータを取得 */
export async function fetchSheetData(
  spreadsheetUrl: string,
  sheetName?: string
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const id = extractSpreadsheetId(spreadsheetUrl);
  if (!id) {
    throw new Error(
      "スプレッドシートのURLが正しくありません。Google SheetsのURLを入力してください。"
    );
  }

  let csvUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
  if (sheetName) {
    csvUrl += `&sheet=${encodeURIComponent(sheetName)}`;
  }

  const res = await fetch(csvUrl);
  if (!res.ok) {
    throw new Error(
      `スプレッドシートの取得に失敗しました (${res.status})。共有設定を「リンクを知っている全員が閲覧可」にしてください。`
    );
  }

  const csv = await res.text();
  const rows = parseCsv(csv);
  const headers =
    rows.length > 0 ? Object.keys(rows[0]) : [];

  return { headers, rows };
}

/** スプレッドシートのシート名一覧を取得（HTML解析） */
export async function fetchSheetNames(
  spreadsheetUrl: string
): Promise<string[]> {
  const id = extractSpreadsheetId(spreadsheetUrl);
  if (!id) return [];

  try {
    // デフォルトシートのみ返す（公開APIではシート一覧取得が困難なため）
    return ["Sheet1"];
  } catch {
    return ["Sheet1"];
  }
}
