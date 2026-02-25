

## No Changes Needed -- This is Expected Behavior

The WhatsApp Inbox is empty because there are no `whatsapp_chats` records in the database yet. This is correct -- chats will appear when:

1. **Inbound messages arrive** from customers via the Wasender → Make.com → `whatsapp-inbound` edge function pipeline
2. **You manually start a new chat** (this feature is currently missing)

The inbox currently has no "New Chat" / "Start Conversation" button, so there is no way to initiate a conversation from the GLMS side.

### Plan: Add a "New Chat" Button to the WhatsApp Inbox

**File to modify:** `src/pages/WhatsAppInbox.tsx`

#### 1. Add a "New Chat" dialog

- Place a "+" or "New Chat" button in the chat list header area (next to the search bar)
- Clicking it opens a dialog with:
  - **Customer search** field (searches `customers` table by name or phone)
  - Shows matching customers with their phone number
  - On selecting a customer, creates a new `whatsapp_chats` row with their `customer_id`, `customer_phone`, `customer_name`, and `client_id`
  - Automatically selects the new chat so the agent can start typing

#### 2. Prevent duplicates

- Before creating a new chat, check if a `whatsapp_chats` row already exists for that `customer_phone` + `client_id`
- If it does, select the existing chat instead of creating a duplicate

#### 3. UI placement

```text
+-------------------------------------------+
| [Search chats...]              [+ New]     |
| [All] [Overdue] [Bot] [Open]              |
+-------------------------------------------+
| (chat list)                                |
```

#### 4. Implementation details

- Add a `Dialog` with a customer search `Input`
- Query `customers` table filtered by `client_id`, matching `full_name` or `phone` using `ilike`
- On selection: upsert into `whatsapp_chats`, then call `fetchChats()` and set `selectedChatId`
- No database migration needed -- uses existing tables

### Files Summary

| File | Action |
|------|--------|
| `src/pages/WhatsAppInbox.tsx` | Add "New Chat" button + customer search dialog |

