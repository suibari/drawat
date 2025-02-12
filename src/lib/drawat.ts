import { agent } from "./oauth";
import { AtpAgent } from '@atproto/api';
import { deleteRow, getAllRows, postRow } from "./supabase";

const collection = 'blue.drawat.vector';
const rkey = 'self';

export async function putRecordVector({
  did,
  paths,
}: {
  did: string,
  paths: string,
}): Promise<void> {

  const record: App.RecordVector = {
    $type: collection,
    did,
    paths,
    createdAt: new Date().toISOString(),
  }

  try {
    // User Repo保存: ATprotoオミットに伴い廃止
    // const response = await agent?.com.atproto.repo.putRecord({
    //   repo: did,
    //   collection,
    //   rkey,
    //   record,
    // });
    // console.log(`[INFO] successful put record`);

    // supabase登録
    await postRow({did, vector: paths, updated_at: new Date().toISOString()});
  } catch (error) {
    console.error("Failed to put record:", error);
  }
}

export async function getRecordsVector(myDid: string): Promise<{
  myDrawingData: string;
  pastDrawingData: string[];
  dids: string[]
} | null> {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; // 1週間前のタイムスタンプ

  try {
    const data = await getAllRows();
    const filteredData = data
      .filter(row => new Date(row.updated_at).getTime() >= oneWeekAgo) // 1週間以内のデータのみ抽出
      .filter(row => row.vector !== null && !Array.isArray(row.vector)); // ログインのみ、かつ旧形式データは除外

    const dids = filteredData
      .map(row => row.did);

    const myDrawingData = filteredData
      .filter(row => row.did === myDid)[0]?.vector;

    const pastDrawingData = filteredData
      .filter(row => row.did !== myDid)
      .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()) // 古いものが前、新しいものが後ろ
      .map(row => row.vector);

    console.log(`[INFO] my records: ${myDrawingData}`);
    console.log(`[INFO] others records, length: ${pastDrawingData.length}`);
    return { pastDrawingData, myDrawingData, dids };
  } catch (error) {
    console.error("Failed to get records:", error);
    return null;
  }
}

export async function deleteRecordVector(did: string): Promise<void> {
  try {
    await agent?.com.atproto.repo.deleteRecord({
      repo: did,
      collection,
      rkey,
    });

    // supabase削除
    await deleteRow(did);
    console.log(`[INFO] successful delete record`);
  } catch (error) {
    console.error("Failed to delete record:", error);
  }
}
