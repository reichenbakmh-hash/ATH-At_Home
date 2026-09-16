export interface Env {
  DB: D1Database;
  DOCS: R2Bucket;
  API_SECRET: string;
  ADMIN_CODE: string;
  CARDDAV_URL?: string;
  CARDDAV_USERNAME?: string;
  CARDDAV_PASSWORD?: string;
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
      parentTaskId?: string;
      recurrenceRule?: string;
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO tasks (id, title, priority, due_at, parent_task_id, recurrence_rule) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(
        id,
        body.title,
        body.priority ?? "normal",
        body.dueAt ?? null,
        body.parentTaskId ?? null,
        body.recurrenceRule ?? null
      )
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleTaskById(
  request: Request,
  env: Env,
  taskId: string
): Promise<unknown> {
  if (request.method === "PATCH") {
    const body = (await request.json()) as {
      status?: string;
      title?: string;
      priority?: string;
      dueAt?: string | null;
    };
    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.status) {
      fields.push("status = ?");
      values.push(body.status);
    }
    if (body.title) {
      fields.push("title = ?");
      values.push(body.title);
    }
    if (body.priority) {
      fields.push("priority = ?");
      values.push(body.priority);
    }
    if (body.dueAt !== undefined) {
      fields.push("due_at = ?");
      values.push(body.dueAt);
    }
    fields.push("updated_at = datetime('now')");

    await env.DB.prepare(
      `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`
    )
      .bind(...values, taskId)
      .run();

    if (body.status === "done") {
      const task = await env.DB.prepare(
        "SELECT recurrence_rule, assigned_member_id FROM tasks WHERE id = ?"
      )
        .bind(taskId)
        .first<{ recurrence_rule: string | null; assigned_member_id: string | null }>();
      if (task?.recurrence_rule && task.assigned_member_id) {
        await env.DB.prepare(
          "UPDATE members SET points = points + 1 WHERE id = ?"
        )
          .bind(task.assigned_member_id)
          .run();
      }
    }

    return { id: taskId };
  }

  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM tasks WHERE id = ? OR parent_task_id = ?")
      .bind(taskId, taskId)
      .run();
    return { id: taskId };
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

async function handleCalendarById(
  request: Request,
  env: Env,
  eventId: string
): Promise<unknown> {
  if (request.method === "PATCH") {
    const body = (await request.json()) as {
      title?: string;
      startsAt?: string;
      endsAt?: string | null;
      visibility?: string;
    };
    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.title) {
      fields.push("title = ?");
      values.push(body.title);
    }
    if (body.startsAt) {
      fields.push("starts_at = ?");
      values.push(body.startsAt);
    }
    if (body.endsAt !== undefined) {
      fields.push("ends_at = ?");
      values.push(body.endsAt);
    }
    if (body.visibility) {
      fields.push("visibility = ?");
      values.push(body.visibility);
    }

    await env.DB.prepare(
      `UPDATE calendar_events SET ${fields.join(", ")} WHERE id = ?`
    )
      .bind(...values, eventId)
      .run();
    return { id: eventId };
  }

  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM calendar_events WHERE id = ?")
      .bind(eventId)
      .run();
    return { id: eventId };
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

async function handleShoppingById(
  request: Request,
  env: Env,
  itemId: string
): Promise<unknown> {
  if (request.method === "PATCH") {
    const body = (await request.json()) as {
      isChecked?: boolean;
      label?: string;
      aisle?: string;
    };
    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.isChecked !== undefined) {
      fields.push("is_checked = ?");
      values.push(body.isChecked ? 1 : 0);
    }
    if (body.label) {
      fields.push("label = ?");
      values.push(body.label);
    }
    if (body.aisle) {
      fields.push("aisle = ?");
      values.push(body.aisle);
    }

    await env.DB.prepare(
      `UPDATE shopping_items SET ${fields.join(", ")} WHERE id = ?`
    )
      .bind(...values, itemId)
      .run();

    if (body.isChecked) {
      const item = await env.DB.prepare(
        "SELECT label FROM shopping_items WHERE id = ?"
      )
        .bind(itemId)
        .first<{ label: string }>();
      if (item) {
        await restockPantryFromShopping(env, item.label);
      }
    }

    return { id: itemId };
  }

  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM shopping_items WHERE id = ?")
      .bind(itemId)
      .run();
    return { id: itemId };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleInventory(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM inventory_items ORDER BY created_at DESC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      label: string;
      purchasePrice?: number;
      purchasedAt?: string;
      warrantyUntil?: string;
      receiptDocumentId?: string;
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO inventory_items (id, label, purchase_price, purchased_at, warranty_until, receipt_document_id) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(
        id,
        body.label,
        body.purchasePrice ?? null,
        body.purchasedAt ?? null,
        body.warrantyUntil ?? null,
        body.receiptDocumentId ?? null
      )
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleInventoryById(
  request: Request,
  env: Env,
  itemId: string
): Promise<unknown> {
  if (request.method !== "DELETE") {
    throw new Response("Méthode non supportée", { status: 405 });
  }
  await env.DB.prepare("DELETE FROM inventory_items WHERE id = ?")
    .bind(itemId)
    .run();
  return { id: itemId };
}

async function handleNotes(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM notes ORDER BY updated_at DESC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      title: string;
      contentMarkdown?: string;
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO notes (id, title, content_markdown) VALUES (?, ?, ?)"
    )
      .bind(id, body.title, body.contentMarkdown ?? "")
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleNoteById(
  request: Request,
  env: Env,
  noteId: string
): Promise<unknown> {
  if (request.method === "PATCH") {
    const body = (await request.json()) as { contentMarkdown?: string; title?: string };
    const fields: string[] = [];
    const values: unknown[] = [];
    if (body.title) {
      fields.push("title = ?");
      values.push(body.title);
    }
    if (body.contentMarkdown !== undefined) {
      fields.push("content_markdown = ?");
      values.push(body.contentMarkdown);
    }
    fields.push("updated_at = datetime('now')");
    await env.DB.prepare(`UPDATE notes SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values, noteId)
      .run();
    return { id: noteId };
  }

  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM notes WHERE id = ?").bind(noteId).run();
    return { id: noteId };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

function extractVcardBlocks(xml: string): string[] {
  const blocks: string[] = [];
  const regex = /<[\w-]*:?address-data[^>]*>([\s\S]*?)<\/[\w-]*:?address-data>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(
      match[1]
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
    );
  }
  return blocks;
}

function parseVcardField(vcard: string, field: string): string | null {
  const regex = new RegExp(`^${field}[^:]*:(.*)$`, "im");
  const match = vcard.match(regex);
  return match ? match[1].trim() : null;
}

async function handleContactsCardDavSync(
  request: Request,
  env: Env
): Promise<unknown> {
  if (request.method !== "POST") {
    throw new Response("Méthode non supportée", { status: 405 });
  }
  if (!env.CARDDAV_URL) {
    throw new Response("CardDAV non configuré", { status: 400 });
  }

  const credentials = btoa(
    `${env.CARDDAV_USERNAME ?? ""}:${env.CARDDAV_PASSWORD ?? ""}`
  );
  const reportBody = `<?xml version="1.0" encoding="utf-8" ?>
<card:addressbook-query xmlns:d="DAV:" xmlns:card="urn:ietf:params:xml:ns:carddav">
  <d:prop><d:getetag/><card:address-data/></d:prop>
</card:addressbook-query>`;

  const response = await fetch(env.CARDDAV_URL, {
    method: "REPORT",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/xml; charset=utf-8",
      Depth: "1"
    },
    body: reportBody
  });

  if (!response.ok) {
    throw new Response("Connexion au serveur CardDAV impossible", {
      status: 502
    });
  }

  const xml = await response.text();
  const vcards = extractVcardBlocks(xml);
  let syncedCount = 0;

  for (const vcard of vcards) {
    const uid = parseVcardField(vcard, "UID");
    const displayName = parseVcardField(vcard, "FN") ?? "Sans nom";
    const phone = parseVcardField(vcard, "TEL");
    const email = parseVcardField(vcard, "EMAIL");
    if (!uid) {
      continue;
    }

    const existing = await env.DB.prepare(
      "SELECT id FROM contacts WHERE carddav_uid = ?"
    )
      .bind(uid)
      .first<{ id: string }>();

    if (existing) {
      await env.DB.prepare(
        "UPDATE contacts SET display_name = ?, phone = ?, email = ? WHERE id = ?"
      )
        .bind(displayName, phone, email, existing.id)
        .run();
    } else {
      await env.DB.prepare(
        "INSERT INTO contacts (id, display_name, phone, email, carddav_uid) VALUES (?, ?, ?, ?, ?)"
      )
        .bind(crypto.randomUUID(), displayName, phone, email, uid)
        .run();
    }
    syncedCount += 1;
  }

  return { syncedCount };
}

async function handleContacts(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM contacts ORDER BY display_name ASC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      displayName: string;
      phone?: string;
      email?: string;
      notes?: string;
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO contacts (id, display_name, phone, email, notes) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(id, body.displayName, body.phone ?? null, body.email ?? null, body.notes ?? null)
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleContactById(
  request: Request,
  env: Env,
  contactId: string
): Promise<unknown> {
  if (request.method !== "DELETE") {
    throw new Response("Méthode non supportée", { status: 405 });
  }
  await env.DB.prepare("DELETE FROM contacts WHERE id = ?")
    .bind(contactId)
    .run();
  return { id: contactId };
}

async function handleAdminStats(env: Env): Promise<unknown> {
  const tables = [
    "tasks",
    "calendar_events",
    "shopping_items",
    "pantry_items",
    "recipes",
    "accounts",
    "shared_expenses",
    "documents",
    "inventory_items",
    "notes",
    "contacts",
    "members"
  ];
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const row = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM ${table}`
    ).first<{ total: number }>();
    counts[table] = row?.total ?? 0;
  }
  return counts;
}

async function handleDocuments(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM documents ORDER BY created_at DESC"
    ).all();
    return results;
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleDocumentUpload(
  request: Request,
  env: Env
): Promise<unknown> {
  if (request.method !== "POST") {
    throw new Response("Méthode non supportée", { status: 405 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const tagsRaw = formData.get("tags");
  if (!(file instanceof File)) {
    throw new Response("Fichier manquant", { status: 400 });
  }

  const id = crypto.randomUUID();
  const r2Key = `documents/${id}-${file.name}`;
  await env.DOCS.put(r2Key, await file.arrayBuffer());

  const tags = typeof tagsRaw === "string"
    ? tagsRaw.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];

  await env.DB.prepare(
    "INSERT INTO documents (id, name, tags_json, r2_key, size_bytes) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(id, file.name, JSON.stringify(tags), r2Key, file.size)
    .run();

  return { id, name: file.name, tagsJson: JSON.stringify(tags), r2Key, sizeBytes: file.size };
}

async function handleDocumentFile(
  request: Request,
  env: Env,
  documentId: string,
  origin: string | null
): Promise<Response> {
  const document = await env.DB.prepare(
    "SELECT r2_key, name FROM documents WHERE id = ?"
  )
    .bind(documentId)
    .first<{ r2_key: string; name: string }>();

  if (!document) {
    return new Response("Document introuvable", {
      status: 404,
      headers: corsHeaders(origin)
    });
  }

  const object = await env.DOCS.get(document.r2_key);
  if (!object) {
    return new Response("Fichier introuvable", {
      status: 404,
      headers: corsHeaders(origin)
    });
  }

  return new Response(object.body, {
    headers: {
      "Content-Disposition": `attachment; filename="${document.name}"`,
      ...corsHeaders(origin)
    }
  });
}

async function handleDocumentById(
  request: Request,
  env: Env,
  documentId: string
): Promise<unknown> {
  if (request.method !== "DELETE") {
    throw new Response("Méthode non supportée", { status: 405 });
  }

  const document = await env.DB.prepare(
    "SELECT r2_key FROM documents WHERE id = ?"
  )
    .bind(documentId)
    .first<{ r2_key: string }>();

  if (document) {
    await env.DOCS.delete(document.r2_key);
  }
  await env.DB.prepare("DELETE FROM documents WHERE id = ?")
    .bind(documentId)
    .run();
  return { id: documentId };
}

async function handleMembers(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM members ORDER BY created_at ASC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as { displayName: string };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO members (id, display_name) VALUES (?, ?)"
    )
      .bind(id, body.displayName)
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleSharedExpenses(
  request: Request,
  env: Env
): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM shared_expenses ORDER BY created_at DESC"
    ).all<{
      id: string;
      label: string;
      amount: number;
      paid_by_member_id: string;
      created_at: string;
    }>();

    const withParticipants = [];
    for (const expense of results) {
      const { results: participants } = await env.DB.prepare(
        "SELECT member_id FROM shared_expense_participants WHERE expense_id = ?"
      )
        .bind(expense.id)
        .all<{ member_id: string }>();
      withParticipants.push({
        ...expense,
        participant_ids: participants.map((row) => row.member_id)
      });
    }
    return withParticipants;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      label: string;
      amount: number;
      paidByMemberId: string;
      participantIds: string[];
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO shared_expenses (id, label, amount, paid_by_member_id) VALUES (?, ?, ?, ?)"
    )
      .bind(id, body.label, body.amount, body.paidByMemberId)
      .run();

    for (const memberId of body.participantIds) {
      await env.DB.prepare(
        "INSERT INTO shared_expense_participants (expense_id, member_id) VALUES (?, ?)"
      )
        .bind(id, memberId)
        .run();
    }

    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleSharedExpenseById(
  request: Request,
  env: Env,
  expenseId: string
): Promise<unknown> {
  if (request.method !== "DELETE") {
    throw new Response("Méthode non supportée", { status: 405 });
  }
  await env.DB.prepare(
    "DELETE FROM shared_expense_participants WHERE expense_id = ?"
  )
    .bind(expenseId)
    .run();
  await env.DB.prepare("DELETE FROM shared_expenses WHERE id = ?")
    .bind(expenseId)
    .run();
  return { id: expenseId };
}

async function handleAccounts(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM accounts ORDER BY created_at ASC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      name: string;
      balance?: number;
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO accounts (id, name, balance) VALUES (?, ?, ?)"
    )
      .bind(id, body.name, body.balance ?? 0)
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleTransactions(
  request: Request,
  env: Env
): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM transactions ORDER BY occurred_at DESC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      accountId: string;
      label: string;
      amount: number;
      kind: string;
      occurredAt: string;
    };
    const id = crypto.randomUUID();
    const signedAmount =
      body.kind === "expense" ? -Math.abs(body.amount) : Math.abs(body.amount);

    await env.DB.prepare(
      "INSERT INTO transactions (id, account_id, label, amount, kind, occurred_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(id, body.accountId, body.label, body.amount, body.kind, body.occurredAt)
      .run();

    await env.DB.prepare(
      "UPDATE accounts SET balance = balance + ? WHERE id = ?"
    )
      .bind(signedAmount, body.accountId)
      .run();

    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleTransactionById(
  request: Request,
  env: Env,
  transactionId: string
): Promise<unknown> {
  if (request.method !== "DELETE") {
    throw new Response("Méthode non supportée", { status: 405 });
  }

  const transaction = await env.DB.prepare(
    "SELECT account_id, amount, kind FROM transactions WHERE id = ?"
  )
    .bind(transactionId)
    .first<{ account_id: string; amount: number; kind: string }>();

  if (transaction) {
    const signedAmount =
      transaction.kind === "expense"
        ? Math.abs(transaction.amount)
        : -Math.abs(transaction.amount);
    await env.DB.prepare(
      "UPDATE accounts SET balance = balance + ? WHERE id = ?"
    )
      .bind(signedAmount, transaction.account_id)
      .run();
  }

  await env.DB.prepare("DELETE FROM transactions WHERE id = ?")
    .bind(transactionId)
    .run();
  return { id: transactionId };
}

async function handleSavingsGoals(
  request: Request,
  env: Env
): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM savings_goals ORDER BY created_at ASC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      label: string;
      targetAmount: number;
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO savings_goals (id, label, target_amount) VALUES (?, ?, ?)"
    )
      .bind(id, body.label, body.targetAmount)
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleSavingsGoalById(
  request: Request,
  env: Env,
  goalId: string
): Promise<unknown> {
  if (request.method === "PATCH") {
    const body = (await request.json()) as { currentAmount: number };
    await env.DB.prepare(
      "UPDATE savings_goals SET current_amount = ? WHERE id = ?"
    )
      .bind(body.currentAmount, goalId)
      .run();
    return { id: goalId };
  }

  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM savings_goals WHERE id = ?")
      .bind(goalId)
      .run();
    return { id: goalId };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handlePantry(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM pantry_items ORDER BY expires_at IS NULL, expires_at ASC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      label: string;
      quantity?: number;
      location?: string;
      expiresAt?: string;
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO pantry_items (id, label, quantity, location, expires_at) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(
        id,
        body.label,
        body.quantity ?? 1,
        body.location ?? null,
        body.expiresAt ?? null
      )
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handlePantryById(
  request: Request,
  env: Env,
  itemId: string
): Promise<unknown> {
  if (request.method === "PATCH") {
    const body = (await request.json()) as {
      quantity?: number;
      location?: string;
      expiresAt?: string | null;
    };
    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.quantity !== undefined) {
      fields.push("quantity = ?");
      values.push(body.quantity);
    }
    if (body.location) {
      fields.push("location = ?");
      values.push(body.location);
    }
    if (body.expiresAt !== undefined) {
      fields.push("expires_at = ?");
      values.push(body.expiresAt);
    }
    fields.push("updated_at = datetime('now')");

    await env.DB.prepare(
      `UPDATE pantry_items SET ${fields.join(", ")} WHERE id = ?`
    )
      .bind(...values, itemId)
      .run();
    return { id: itemId };
  }

  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM pantry_items WHERE id = ?")
      .bind(itemId)
      .run();
    return { id: itemId };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function restockPantryFromShopping(
  env: Env,
  label: string
): Promise<void> {
  const existing = await env.DB.prepare(
    "SELECT id, quantity FROM pantry_items WHERE label = ?"
  )
    .bind(label)
    .first<{ id: string; quantity: number }>();

  if (existing) {
    await env.DB.prepare(
      "UPDATE pantry_items SET quantity = ?, updated_at = datetime('now') WHERE id = ?"
    )
      .bind(existing.quantity + 1, existing.id)
      .run();
    return;
  }

  await env.DB.prepare(
    "INSERT INTO pantry_items (id, label, quantity) VALUES (?, ?, 1)"
  )
    .bind(crypto.randomUUID(), label)
    .run();
}

async function handleRecipes(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM recipes ORDER BY created_at DESC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      title: string;
      ingredients: { label: string; aisle: string }[];
      instructions?: string;
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO recipes (id, title, ingredients_json, instructions) VALUES (?, ?, ?, ?)"
    )
      .bind(
        id,
        body.title,
        JSON.stringify(body.ingredients ?? []),
        body.instructions ?? null
      )
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleRecipeById(
  request: Request,
  env: Env,
  recipeId: string
): Promise<unknown> {
  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM recipes WHERE id = ?")
      .bind(recipeId)
      .run();
    return { id: recipeId };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleMeals(request: Request, env: Env): Promise<unknown> {
  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT * FROM meals ORDER BY planned_date ASC"
    ).all();
    return results;
  }

  if (request.method === "POST") {
    const body = (await request.json()) as {
      recipeId: string;
      plannedDate: string;
      slot?: string;
    };
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO meals (id, recipe_id, planned_date, slot) VALUES (?, ?, ?, ?)"
    )
      .bind(id, body.recipeId, body.plannedDate, body.slot ?? "dinner")
      .run();
    return { id };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleMealById(
  request: Request,
  env: Env,
  mealId: string
): Promise<unknown> {
  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM meals WHERE id = ?").bind(mealId).run();
    return { id: mealId };
  }

  throw new Response("Méthode non supportée", { status: 405 });
}

async function handleMealExport(
  request: Request,
  env: Env,
  mealId: string
): Promise<unknown> {
  if (request.method !== "POST") {
    throw new Response("Méthode non supportée", { status: 405 });
  }

  const meal = await env.DB.prepare("SELECT * FROM meals WHERE id = ?")
    .bind(mealId)
    .first<{ recipe_id: string }>();
  if (!meal) {
    throw new Response("Repas introuvable", { status: 404 });
  }

  const recipe = await env.DB.prepare(
    "SELECT ingredients_json FROM recipes WHERE id = ?"
  )
    .bind(meal.recipe_id)
    .first<{ ingredients_json: string }>();
  if (!recipe) {
    throw new Response("Recette introuvable", { status: 404 });
  }

  const ingredients = JSON.parse(recipe.ingredients_json) as {
    label: string;
    aisle: string;
  }[];

  const createdIds: string[] = [];
  for (const ingredient of ingredients) {
    const id = crypto.randomUUID();
    createdIds.push(id);
    await env.DB.prepare(
      "INSERT INTO shopping_items (id, label, aisle, source_meal_id) VALUES (?, ?, ?, ?)"
    )
      .bind(id, ingredient.label, ingredient.aisle, mealId)
      .run();
  }

  return { createdIds };
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

type RouteHandler = (
  request: Request,
  env: Env,
  params: string[]
) => Promise<unknown>;

const routes: { pattern: RegExp; handle: RouteHandler }[] = [
  { pattern: /^\/api\/tasks$/, handle: (request, env) => handleTasks(request, env) },
  { pattern: /^\/api\/tasks\/([\w-]+)$/, handle: (request, env, [id]) => handleTaskById(request, env, id) },
  { pattern: /^\/api\/calendar$/, handle: (request, env) => handleCalendar(request, env) },
  { pattern: /^\/api\/calendar\/([\w-]+)$/, handle: (request, env, [id]) => handleCalendarById(request, env, id) },
  { pattern: /^\/api\/shopping$/, handle: (request, env) => handleShopping(request, env) },
  { pattern: /^\/api\/shopping\/([\w-]+)$/, handle: (request, env, [id]) => handleShoppingById(request, env, id) },
  { pattern: /^\/api\/admin\/login$/, handle: (request, env) => handleAdminLogin(request, env) },
  { pattern: /^\/api\/inventory$/, handle: (request, env) => handleInventory(request, env) },
  { pattern: /^\/api\/inventory\/([\w-]+)$/, handle: (request, env, [id]) => handleInventoryById(request, env, id) },
  { pattern: /^\/api\/notes$/, handle: (request, env) => handleNotes(request, env) },
  { pattern: /^\/api\/notes\/([\w-]+)$/, handle: (request, env, [id]) => handleNoteById(request, env, id) },
  { pattern: /^\/api\/contacts$/, handle: (request, env) => handleContacts(request, env) },
  { pattern: /^\/api\/contacts\/sync-carddav$/, handle: (request, env) => handleContactsCardDavSync(request, env) },
  { pattern: /^\/api\/contacts\/([\w-]+)$/, handle: (request, env, [id]) => handleContactById(request, env, id) },
  { pattern: /^\/api\/documents$/, handle: (request, env) => handleDocuments(request, env) },
  { pattern: /^\/api\/documents\/upload$/, handle: (request, env) => handleDocumentUpload(request, env) },
  { pattern: /^\/api\/documents\/([\w-]+)$/, handle: (request, env, [id]) => handleDocumentById(request, env, id) },
  { pattern: /^\/api\/members$/, handle: (request, env) => handleMembers(request, env) },
  { pattern: /^\/api\/shared-expenses$/, handle: (request, env) => handleSharedExpenses(request, env) },
  { pattern: /^\/api\/shared-expenses\/([\w-]+)$/, handle: (request, env, [id]) => handleSharedExpenseById(request, env, id) },
  { pattern: /^\/api\/budget\/accounts$/, handle: (request, env) => handleAccounts(request, env) },
  { pattern: /^\/api\/budget\/transactions$/, handle: (request, env) => handleTransactions(request, env) },
  { pattern: /^\/api\/budget\/transactions\/([\w-]+)$/, handle: (request, env, [id]) => handleTransactionById(request, env, id) },
  { pattern: /^\/api\/budget\/goals$/, handle: (request, env) => handleSavingsGoals(request, env) },
  { pattern: /^\/api\/budget\/goals\/([\w-]+)$/, handle: (request, env, [id]) => handleSavingsGoalById(request, env, id) },
  { pattern: /^\/api\/pantry$/, handle: (request, env) => handlePantry(request, env) },
  { pattern: /^\/api\/pantry\/([\w-]+)$/, handle: (request, env, [id]) => handlePantryById(request, env, id) },
  { pattern: /^\/api\/recipes$/, handle: (request, env) => handleRecipes(request, env) },
  { pattern: /^\/api\/recipes\/([\w-]+)$/, handle: (request, env, [id]) => handleRecipeById(request, env, id) },
  { pattern: /^\/api\/meals$/, handle: (request, env) => handleMeals(request, env) },
  { pattern: /^\/api\/meals\/([\w-]+)\/export$/, handle: (request, env, [id]) => handleMealExport(request, env, id) },
  { pattern: /^\/api\/meals\/([\w-]+)$/, handle: (request, env, [id]) => handleMealById(request, env, id) },
  {
    pattern: /^\/api\/admin\/stats$/,
    handle: (request, env) => {
      if (request.headers.get("X-Admin-Code") !== env.ADMIN_CODE) {
        throw new Response("Non autorisé", { status: 401 });
      }
      return handleAdminStats(env);
    }
  }
];

const documentFilePattern = /^\/api\/documents\/([\w-]+)\/file$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    const documentFileMatch = url.pathname.match(documentFilePattern);
    if (documentFileMatch) {
      return handleDocumentFile(request, env, documentFileMatch[1], origin);
    }

    try {
      for (const route of routes) {
        const match = url.pathname.match(route.pattern);
        if (match) {
          const params = match.slice(1);
          return jsonResponse(
            await route.handle(request, env, params),
            200,
            origin
          );
        }
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
