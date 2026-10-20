<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Channel, event and EPG data are fetched only through server functions in src/lib/api.ts and cached with TanStack Query; why: avoids CORS issues and duplicate requests across routes.
- Raw API responses go through src/lib/normalize.ts and time logic lives in src/lib/time.ts (tested); why: keeps validation and live/current rules in one testable place.
- AI recommendations use the shared schedule reader in src/lib/api.ts and server-only AI SDK Responses helpers, returning only validated catalog candidate IDs; why: prevents invented programs and keeps keys private without replacing existing catalog or player flows.
- AI access denials are persisted in a service-role-only table and never retried automatically; why: blocked provider or credit access must survive reloads and await owner recovery.
