# E22 Add to Cart without the wait

Branch: `epic/E22-add-to-cart-wait`. Depends on: E16, E19, E21. Blocks: nothing. One PR.

## Goal

An add is acknowledged at once since E16, and the button still spins until the API has saved it: about 6 s for a first add, which creates a cart and then writes to it, and about 3 s for every add after that (`callout.md`, "Cart latency after E16"; measured again on production on 21 Sep 2026: 5.9 to 6.4 s and 2.8 to 3.8 s). No storefront change makes the API faster. This epic halves the first add by creating the cart before it is needed, and takes the wait off the button for every add.

## The cart is opened on intent

- `prepareCart()`, a Server Action in `app/cart/actions.ts`: when the visitor has no cart cookie it creates a cart and sets the cookie; with one it does nothing. A failure is logged and left to the add, which opens a cart as it does today.
- The Add to Cart form calls it once per page load, the first time the pointer enters the form or focus lands inside it, which covers the quantity control and the button.
- A Server Action and not a route handler: Next runs a client's actions one at a time, so an add clicked while the cart is being created queues behind it and finds the cookie. That add costs what it costs today and no more.
- It is not called on page view. A cart cookie makes the header badge read the cart on every full page load, which is the slow endpoint; a visitor who only looks should not pay for that.
- A touch screen has no hover, so a tap straight on the button gains nothing. A tap on the quantity control first does.

## The button does not wait for the save

- With JavaScript, a submit calls `addToCart` and returns the button at once. The button reads "Added" for `ADDED_LABEL_MS` and is never disabled by a save in flight. It is disabled only when nothing remains to add.
- Adds queue: Next sends them one at a time, in order. The form holds the quantities in flight and reports their sum, so the header badge counts up and the stock line and the card badges count down by everything not yet saved, and the quantity control cannot exceed what is left after them.
- The status line under the button keeps its meaning: "Added." with an inert "View cart" while any add is in flight, a link once all have landed, the error when one fails. A failed add takes its quantity back off the counts.
- Each result is applied when it arrives, even if the visitor has left the page: the providers live in the layout.
- Before hydration and without JavaScript the form still posts to the same action natively.
- An add still waits for a visit call in flight (E21).

## Out of scope

The cart page's double read after a quantity change; a cart count cookie for the badge; creating the cart on page view; anything that needs the API to be faster.

## Acceptance

Against a production build:

- [ ] A first add after the pointer rested on the form makes one cart call in the action, not two, and is saved in about the time of a second add.
- [ ] The button is usable again within 0.1 s of a click, for a first and a later add.
- [ ] Three quick adds of 1 land as a line of 3; the header badge and the stock line show all three at once, and "View cart" becomes a link only after the last.
- [ ] Adds cannot exceed what remains, counting those in flight.
- [ ] A failed add shows its error and puts the counts back.
- [ ] A page view alone sets no cart cookie.
- [ ] Build output marks every page as before, and `pnpm verify` passes.
- [ ] Before and after timings are recorded in `callout.md`.
