"use server"

import { supabase } from "@/lib/supabase"
import { whopsdk } from "@/lib/whop-sdk"

export type CachedUser = {
  id: string
  whop_user_id: string
  name: string | null
  username: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
}

export async function upsertUsersFromWhop(userIds: string[]) {
  if (!Array.isArray(userIds) || userIds.length === 0) return { success: true }
  const unique = Array.from(new Set(userIds))
  const users: any[] = []
  for (const id of unique) {
    try {
      const u = await whopsdk.users.retrieve(id)
      users.push({
        whop_user_id: id,
        name: (u as any).name || null,
        username: (u as any).username || null,
        email: (u as any).email || null,
        avatar_url: (u as any).avatar_url || null,
      })
    } catch (e) {
      // skip failures but continue
    }
  }
  if (users.length === 0) return { success: false, error: "No valid users" }

  const { error } = await supabase
    .from("users")
    .upsert(users, { onConflict: "whop_user_id" })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function resolveUsernamesToIds(usernames: string[]) {
  if (!Array.isArray(usernames) || usernames.length === 0) return { success: false, error: "No usernames provided" }
  const unique = Array.from(new Set(usernames))
  const userIds: string[] = []
  const users: any[] = []
  
  for (const username of unique) {
    try {
      // Search for user by username using Whop SDK
      const usersResponse = await whopsdk.users.list({ username })
      if (usersResponse.data && usersResponse.data.length > 0) {
        const user = usersResponse.data[0]
        userIds.push(user.id)
        users.push({
          whop_user_id: user.id,
          name: user.name || null,
          username: user.username || null,
          email: user.email || null,
          avatar_url: user.avatar_url || null,
        })
      }
    } catch (e) {
      console.error(`Failed to resolve username ${username}:`, e)
      // Continue with other usernames
    }
  }
  
  if (userIds.length === 0) return { success: false, error: "No valid usernames found" }

  // Cache the resolved users
  if (users.length > 0) {
    const { error } = await supabase
      .from("users")
      .upsert(users, { onConflict: "whop_user_id" })
    
    if (error) console.error("Failed to cache users:", error)
  }

  return { success: true, data: userIds }
}

export async function getCachedUsersByIds(userIds: string[]) {
  if (userIds.length === 0) return []
  const { data } = await supabase
    .from("users")
    .select("*")
    .in("whop_user_id", userIds)
  return data || []
}

export async function grantExamRetake(moduleId: string, userIds: string[], grantedBy: string) {
  try {
    // Ensure users are cached
    await upsertUsersFromWhop(userIds)

    const rows = userIds.map((uid) => ({ module_id: moduleId, user_id: uid, granted_by: grantedBy }))
    const { error } = await supabase.from("exam_retakes").insert(rows)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    return { success: false, error: "Failed to grant retake" }
  }
}

export async function grantExamRetakeByUsernames(moduleId: string, usernames: string[], grantedBy: string) {
  try {
    // Resolve usernames to user IDs
    const resolveResult = await resolveUsernamesToIds(usernames)
    if (!resolveResult.success) {
      return { success: false, error: resolveResult.error }
    }

    const userIds = resolveResult.data || []
    if (userIds.length === 0) {
      return { success: false, error: "No valid usernames found" }
    }

    // Grant retakes using the resolved user IDs
    return await grantExamRetake(moduleId, userIds, grantedBy)
  } catch (e) {
    return { success: false, error: "Failed to grant retake" }
  }
}

export async function searchCachedUsers(query: string, limit: number = 10) {
  try {
    const q = (query || "").trim()
    if (!q) return { success: true, data: [] }

    const { data, error } = await supabase
      .from("users")
      .select("whop_user_id, username, name, email")
      .or(`username.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(limit)

    if (error) return { success: false, error: error.message, data: [] }
    return { success: true, data: data || [] }
  } catch (e) {
    return { success: false, error: "Failed to search users", data: [] }
  }
}


