BLUSH & BOW — CONNECTED PAGES

Files in this package:
- script.js       Common localStorage cart system
- shop.html       Shop page connected to cart
- product.html    Product page connected to cart
- cart.html       Cart page reading the same cart
- cart-add.css    Small shared cart badge/toast styles

IMPORTANT:
These pages expect your existing:
- index.html
- style.css
- shop.css
- product.css
- cart.css

Replace the corresponding old shop.html, product.html and cart.html with
the versions in this package, and put script.js + cart-add.css in the
same folder.

Then the flow works:
Shop/Product -> Add to Cart -> localStorage -> Cart -> Checkout placeholder.

This is a frontend cart only. Real orders, login, database and payment
will be connected later through the backend.
