# commUITy to HelpHub feature coverage

This comparison uses `commUITy-frontend` as the functional reference and the current
`helphub-backend` controllers as the API contract. UI implementation stays within the
existing HelpHub design system.

| Functional area | commUITy frontend | HelpHub before migration | Backend support | Decision |
| --- | --- | --- | --- | --- |
| Authentication and profile editing | Login, register, profile | OTP screens existed as demo-only UI before migration | Complete | Migrated registration verification, resend OTP, forgot/reset password and profile editing |
| Support requests | Feed, create, edit, moderation, requester dashboard | Feed, create, edit, moderation, personal requests | Complete | Already covered |
| Support needs and contributions | Create/update needs and record contributions | Create/update/delete needs and record/view contributions | Complete | Already covered |
| Volunteer assignments | Apply, review, cancel, complete, volunteer dashboard | Apply, review, cancel, complete, assignment list | Complete | Already covered |
| Posts, comments and reactions | Complete social feed | Complete social section | Complete | Already covered |
| Chat and notifications | Conversations, realtime messages and notifications | Conversations, image messages, realtime messages and notifications | Complete | Already covered |
| Reports | Submit, history and admin moderation | Submit, history and admin moderation | Complete | Already covered |
| Categories, users and support locations | Admin/collaborator management | Admin/collaborator management | Complete | Already covered; keep manual coordinates |
| Role dashboards | Separate requester, volunteer, collaborator and admin dashboards | Home screen uses placeholder statistics | Complete through existing APIs | Migrate as a live role-aware HelpHub dashboard |
| Admin statistics | Users, requests, categories, posts and reports | Missing | Complete | Migrate |
| Community funds | List, create, detail and membership management | Missing | Complete | Migrate |
| Donations and expenses | Donate, expense history and expense creation | Missing | Complete for recorded donations and expenses | Migrate backend-supported flow |
| Transaction history | Donations and support-need contributions | Missing | Only personal community-fund donations are exposed | Migrate donation history only |
| Member profile, message and report shortcuts | Public member profile with direct message/report | Admin-only profile before migration | Complete | Migrated using HelpHub profile, chat and report flows |
| Maps, Places and directions | Map feed, geocoding, address suggestions and directions | Map packages exist | Backend has coordinates but map provider is external | Excluded by request |
| Wallet | Local mock balance, cards, banks, top-up and withdrawal | Missing | No wallet API | Do not migrate mock data |
| PayOS callbacks and checkout | Frontend routes call PayOS endpoints | Missing | Endpoints are absent in the current backend | Do not add a broken flow |
| Money-transfer tickets | Frontend API/hooks exist | Missing | Controller is absent in the current backend | Do not add a broken flow |
| Personal support-contribution history | Frontend calls a personal history endpoint | Missing | Endpoint is absent in the current backend | Do not add a broken flow |

## Migration boundary

- Read-only: `commUITy-frontend` and `helphub-backend`.
- Writable: `helphub-frontend` only.
- No Google Maps API key, Places API, geocoding, map rendering or directions work.
- No UI is copied directly; API behavior is adapted to HelpHub components, colors,
  navigation and role access.
