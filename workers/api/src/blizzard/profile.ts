import type { Env } from "../env";

export type WowCharacter = {
  realm: string;
  name: string;
  level: number;
  id: string;
};

type BlizzardCharacter = {
  name: string;
  realm: { slug: string };
  level: number;
};

type BlizzardWowAccount = {
  characters: BlizzardCharacter[];
};

type BlizzardProfileResponse = {
  wow_accounts?: BlizzardWowAccount[];
};

export async function fetchUserCharacters(env: Env, accessToken: string): Promise<WowCharacter[]> {
  const res = await fetch(
    `${env.PROFILE_API_HOST}/profile/user/wow?namespace=profile-eu&locale=en_GB`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    throw { code: "UPSTREAM_ERROR", message: `Failed to fetch characters: ${res.status}`, status: 502 };
  }

  const data = (await res.json()) as BlizzardProfileResponse;
  const characters: WowCharacter[] = [];

  for (const account of data.wow_accounts || []) {
    for (const char of account.characters || []) {
      characters.push({
        realm: char.realm.slug,
        name: char.name,
        level: char.level,
        id: `${char.realm.slug}/${char.name.toLowerCase()}`,
      });
    }
  }

  // Sort by level descending
  characters.sort((a, b) => b.level - a.level);
  return characters;
}
