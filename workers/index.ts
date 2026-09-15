export interface Env {
  DB: D1Database;
  API_SECRET: string;
  ADMIN_CODE: string;
}

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Credentials": "true"
  };
}

function jsonResponse(
  data: unknown,
  status: number,
  origin: string | null
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin)
    }
  });
}

async function handleTasks(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      title: string;
      priority?: string;
      dueAt?: string;
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO tasks (id, title, priority, due_at) VALUES (?, ?, ?, ?)"
    )
      .bind(id, body.title, body.priority ?? "normal", body.dueAt ?? null)
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleCalendar(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM calendar_events ORDER BY starts_at ASC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      title: string;
      startsAt: string;
      endsAt?: string;
      visibility?: string;
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO calendar_events (id, title, starts_at, ends_at, visibility) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        id,
        body.title,
        body.startsAt,
        body.endsAt ?? null,
        body.visibility ?? "household"
      )
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleShopping(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM shopping_items ORDER BY created_at DESC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as { label: string; aisle?: string };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO shopping_items (id, label, aisle) VALUES (?, ?, ?)"
    )
      .bind(id, body.label, body.aisle ?? null)
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleAdminLogin(
  request: Request,
  env: Env
): Promise<unknown> {
  const body = (await request.json()) as { code: string };
  if (body.code !== env.ADMIN_CODE) {
    throw new Response("Code invalide", { status: 401 });
  }
  const sessionId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO sessions (id, is_admin, expires_at) VALUES (?, 1, datetime('now', '+12 hours'))"
  )
    .bind(sessionId)
    .run();
  return { sessionId };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    try {
      if (url.pathname === "/api/tasks") {
        return jsonResponse(await handleTasks(request, env), 200, origin);
      }
      if (url.pathname === "/api/calendar") {
        return jsonResponse(await handleCalendar(request, env), 200, origin);
      }
      if (url.pathname === "/api/shopping") {
        return jsonResponse(await handleShopping(request, env), 200, origin);
      }
      if (url.pathname === "/api/admin/login") {
        return jsonResponse(
          await handleAdminLogin(request, env),
          200,
          origin
        );
      }

      return jsonResponse({ message: "Route inconnue" }, 404, origin);
    } catch (error) {
      if (error instanceof Response) {
        return jsonResponse(
          { message: await error.text() },
          error.status,
          origin
        );
      }
      return jsonResponse({ message: "Erreur interne" }, 500, origin);
    }
  }
};
