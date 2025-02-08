import { PUBLIC_WORKERS_URL } from "$env/static/public";
import { agent } from "./oauth";
import { AtpAgent } from '@atproto/api';

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
    const response = await agent?.com.atproto.repo.putRecord({
      repo: did,
      collection,
      rkey,
      record,
    });
    console.log(`[INFO] successful put record`);
  } catch (error) {
    console.error("Failed to put record:", error);
  }
}

export async function getRecordsVector(): Promise<{ paths: App.Path[]; dids: string[] } | null> {
  const result: App.Path[] = [];
  let dids: string[] = [];

  try {
    // 全認証済みユーザのDID取得
    const response = await fetch(PUBLIC_WORKERS_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json() as { did: string; created_at: string }[];
    dids = data.map(d => d.did);

    // didsの全てのblue.drawat.vectorのrecordを収集
    const agent = new AtpAgent({ service: 'https://bsky.social' });
    
    for (const did of dids) {
      try {
        const response = await agent.com.atproto.repo.getRecord({
          repo: did,
          collection,
          rkey,
        });
        if (response) {
          const value = response.data.value as App.RecordVector;
          result.push(...value.paths);
        }
      } catch (error) {
        console.warn(`[WARN] Failed to get record for DID: ${did}, skipping...`, error);
        continue; // エラーを無視して次のdidへ
      }
    }

    console.log(`[INFO] Successfully got records, length: ${result.length}`);
    return { paths: result, dids };
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
