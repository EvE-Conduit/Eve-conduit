# Freight

Freight services: routes with your rates, a calculator that gives members the exact courier contract to make, and
every courier contract to the hauling corporation checked against its route before anyone accepts it.

- **Getting a price** (everyone a service is open to): pick a route, enter the volume and the collateral (`1.5b`,
  `250m` and `12k` work), and get the reward with the steps to make the contract: who to, pick-up, delivery, reward,
  collateral, expiration and days to complete, each with a copy button. Cargo over the route's limits is flagged
  straight away. **My contracts** lists the courier contracts the member's characters made to the services.
- **Routes** (per service): each end is a station or structure, or a whole solar system (any pick-up or delivery in
  it counts). A route can run both ways at the same rates. The reward is a base price + ISK per m³ + ISK per jump + a
  percentage of the collateral, never under a minimum, with optional maximum volume and collateral. Jumps are counted
  by ESI's route finder when a route is saved (shortest route), or typed in by hand.
- **Contract checks**: every 15 minutes each service owner's contracts are read (character, and corporation for
  services that go to the corporation). Every courier contract to the service is matched to a route (a route naming
  the station or structure beats one naming only the system) and checked: no route covers it, a reward below (or
  above) what the route asks, too much volume or collateral, fewer days to complete than the service asks for,
  made out to the wrong character or corporation, expired before anyone took it, and past its delivery deadline.
  Courier contracts to the owner's other half (the character, for a corporation service) are tracked only when they
  run one of the routes, so the owner's own hauling stays out.
- **Hauling queue** (permission `freight.view_contracts`): waiting, in-transit, problem and finished contracts with
  who made them, who took them, the reward against what the route asks, and the open rewards, collateral and volume.
  Haulers and managers are notified of new contracts, with a warning when something's wrong.
- **Running services** (permission `freight.manage_freight`): create services owned by one of your characters (its
  login reads the contracts), pick the states and groups that may use them, add routes, and see each service's open
  and delivered contracts. **Read contracts now** reads them straight away. Changing a route checks the open
  contracts again.
- **Public services**: a service marked public has a calculator anyone can use at `/public/p/freight/<id>`, without
  an account. Prices store nothing, so there's nothing to rate-limit.

Give the permissions to a state (Administration → States) or a group (Administration → Groups). Contracts are read
with `esi-contracts.read_character_contracts.v1` and `esi-contracts.read_corporation_contracts.v1`.

Events for webhooks: `freight.contract_created`, `freight.contract_finished` (a contract was delivered, failed,
rejected, deleted or expired). Post them to a Discord channel with a webhook (Administration → Integrations). New
contracts can ping on Discord: switch it on under **Discord pings** on the Services page. With the Discord plugin
linked you also pick the roles to ping. Needs EvE Conduit 0.5.55 or newer.
