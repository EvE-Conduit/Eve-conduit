# Secret Santa

Members sign up, a draw pairs everyone up, and each sends a gift to the person they drew. Nobody knows who their own
Secret Santa is.

## Documentation

- [User guide](docs/user-guide.md): for members.
- [Admin guide](docs/admin-guide.md): for officers and administrators.

- **Events** (permission `secretsanta.organise_events`): a name, a description, when sign-up closes, a gift deadline,
  a suggested budget in ISK, notes only organisers see, and who may join (any mix of states and groups; nothing picked
  means every member). A new event can notify everyone who may join.
- **Signing up:** one sign-up per person, not per character, so alts count once. Pick the character that should get
  the gift and write a wish list or a hint. You can withdraw until the draw.
- **The draw:** after sign-up closes, an organiser draws. It's one random chain through everyone, so nobody gets
  themselves. Organisers can keep two people apart (a couple, say); the draw respects that, or says why it can't. The
  draw is stored. It can be done again until the results are sent; after that it's fixed.
- **Sending the results** tells everyone who they give to. Each person only ever sees their own giftee: the character
  to send to and their wish list.
- **Gifts:** mark yours sent, with an optional note (a contract, ISK). Your giftee is told it's on its way. When it
  arrives they mark it received and can leave a thank-you, which reaches you without telling them who you are.
- **Organisers** see who signed up, who sent and who got a gift, but not who gives to whom. **Show who gives to
  whom** shows the pairs, and each look goes in the audit log.
- **Taking someone out after the draw:** whoever was giving to them gets their giftee instead, and is told. Late
  sign-ups after the draw aren't possible.
- **Reminders:** two days before the gift deadline, everyone who hasn't marked their gift sent gets a notification.
- **After the end** an organiser can show every pair to the participants.
- **Dashboard widget:** your current event and who you give to, or an event you can still join.

Needs no ESI scopes. Needs EvE Conduit 0.5.55 or newer.
