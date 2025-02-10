import { agent } from "./oauth";
import { AtpAgent } from '@atproto/api';
import { getAllRows, postRow } from "./supabase";

const collection = 'blue.drawat.vector';
const rkey = 'self';

// export async function test(did: string) {
//   if (!browser) return;

//   if (session) {
//     const agent = new Agent(session);
//     const {data} = await agent.getProfile({actor: did});
//     console.log(data);
//   }
// }

export async function putRecordVector({
  did,
  paths,
}: {
  did: string,
  paths: App.Path[],
}): Promise<void> {
  const record: App.RecordVector = {
    $type: collection,
    paths,
    createdAt: new Date().toISOString(),
  }

  try {
    // User Repo保存
    const response = await agent?.com.atproto.repo.putRecord({
      repo: did,
      collection,
      rkey,
      record,
    });
    console.log(`[INFO] successful put record`);

    // supabase登録
    await postRow({did, vector: paths, updated_at: new Date().toISOString()});
  } catch (error) {
    console.error("Failed to put record:", error);
  }
}

export async function getRecordsVector(): Promise<{ paths: App.Path[]; dids: string[] } | null> {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; // 1週間前のタイムスタンプ

  try {
    const data = await getAllRows();
    const filteredData = data.filter(row => new Date(row.updated_at).getTime() >= oneWeekAgo);
    const dids = filteredData
      .filter(row => row.vector?.length > 0)
      .map(row => row.did);
    const paths = filteredData
      .flatMap(row => row.vector?.length > 0 ? row.vector : []);

    console.log(`[INFO] Successfully got records, length: ${paths.length}`);
    return { paths, dids };
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
    console.log(`[INFO] successful delete record`);
  } catch (error) {
    console.error("Failed to delete record:", error);
  }
}
