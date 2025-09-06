```bash
npm install
npm start
```

Diagrama de flujo: https://drive.google.com/file/d/1BSwTQ0zkJtvEZr3ykQqndteWzxu-kuIw/view?usp=sharing


## Apps

- **Consumer:** http://localhost:5050/app1/
  - Browse stores, view product availability, add to cart (with stock validation), select payment method, place orders

- **Store Admin:** http://localhost:5050/app2/
  - Register new stores, login, manage store, create products with inventory, update stock levels, view orders

- **Driver:** http://localhost:5050/app3/
  - Register/Login as driver, accept orders, pick up orders, and deliver orders (with payment method information)
## Sample Data

- Stores: Bodega Central, Pizza Nova
- Products: Water, Chips, Pizza
- Users: Consumer (Alice)
- Drivers: Bob (bob/123)
- Store Accounts: bodega/123, pizza/123

## Store Registration

New stores can be registered through the Store Admin app:
1. Go to http://localhost:5050/app2/
2. Click "Register" to show registration fields
3. Enter store name, description, username, and password
4. Click "Register" to create the store
5. Login with your credentials to manage the store

## Driver Registration

New drivers can be registered through the Driver app:
1. Go to http://localhost:5050/app3/
2. Click "Register" to show registration fields
3. Enter full name, phone, vehicle type, username, and password
4. Click "Register" to create the driver account
5. Login with your credentials to start accepting orders

## Payment Methods

The system supports multiple payment options:
- **Cash on Delivery**: Traditional cash payment upon delivery
- **Credit/Debit Card**: Card payment processed at checkout
- **PayPal**: PayPal digital wallet integration
- **Apple Pay**: Apple's mobile payment service
- **Google Pay**: Google's mobile payment service

## Inventory Management

The system now includes comprehensive inventory management:
- **Product Stock**: Each product has a stock quantity that can be managed by store admins
- **Stock Validation**: Consumers cannot add more items to cart than available in stock
- **Real-time Updates**: Stock levels are updated in real-time when orders are placed
- **Visual Indicators**: Products show availability status (green for in stock, red for out of stock)

## Order Workflow

Orders now follow a complete workflow:
1. **Created** - Order placed by consumer (stock is validated and reduced)
2. **Accepted** - Driver accepts the order
3. **Picked Up** - Driver picks up the order from the store
4. **Delivered** - Driver delivers the order to the consumer
