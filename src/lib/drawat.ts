import { browser } from "$app/environment";
import { PUBLIC_WORKERS_URL } from "$env/static/public";
import { session } from "./oauth";
import { Agent } from '@atproto/api';

let agent: Agent | null = null;
const collection = 'blue.drawat.vector';
const rkey = 'self';

if (session) {
  agent = new Agent(session);
}

export async function test(did: string) {
  if (!browser) return;

  if (session) {
    const agent = new Agent(session);
    const {data} = await agent.getProfile({actor: did});
    console.log(data);
  }
}

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

export async function getRecordsVector(): Promise<App.Path[] | null> {
  const result: App.Path[] = [];

  try {
    // 全認証済みユーザのDID取得
    const response = await fetch(PUBLIC_WORKERS_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json() as {did: string, created_at: string}[];
    const dids = data.map(d => d.did);

    // didsの全てのblue.drawat.vectorのrecordを収集
    for (const did of dids) {
      const response = await agent?.com.atproto.repo.getRecord({
        repo: did,
        collection,
        rkey,
      });
      if (response) {
        const value = response.data.value as App.RecordVector;
        console.log(value)
        result.push(...value.paths);
      }
    }

    console.log(`[INFO] successful got records, length: ${result.length}`);
    return result;
  } catch (error) {
    console.error("Failed to get records:", error);
    return null;
  }
}
