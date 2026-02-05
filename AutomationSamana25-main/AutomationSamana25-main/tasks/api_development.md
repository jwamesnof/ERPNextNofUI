# InvParser App - API Development 

In this task you'll extend the InvParser app by improving the existed endpoints, as well as adding new endpoints. 

# Guidelines

### The `POST /extract` endpoint

1. Modify the `/extract` response to return a response as the following scheme: 

   ```json 
   {
     "confidence": 1,   // The confidence that the provided document is an invoice
     "data": {
       "VendorName": "string",
       "VendorNameLogo": "string",
       "InvoiceId": "string",
       "InvoiceDate": "string",
       "ShippingAddress": "string",
       "BillingAddressRecipient": "string",
       "AmountDue": "number",
       "SubTotal": "number",
       "ShippingCost": "number",
       "InvoiceTotal": "number",
       "Items": [
         {
           "Description": "string",
           "Name": "string",
           "Quantity": "number",
           "UnitPrice": "number",
           "Amount": "number"
         }
       ]
     },
     "dataConfidence": {  // The confidences for each extracted field
       "VendorName": "number",
       "VendorNameLogo": "number",
       "InvoiceId": "number",
       "InvoiceDate": "number",
       "ShippingAddress": "number",
       "BillingAddressRecipient": "number",
       "AmountDue": "number",
       "SubTotal": "number",
       "ShippingCost": "number",
       "InvoiceTotal": "number"
     }
   }
   ```

2. All extracted invoices should be stored in a database. Essentially, you should just call `save_inv_extraction(result)` (where `result` is the response dictionary) to save the extraction result to the database.
   You must understand how exactly the data is stored in the database.

> [!TIP]
> Install the [Database-client](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-database-client2) plugin in your VSCode to visualize the database structure and data.

3. The endpoint should return `400` status code if the uploaded file is not a valid PDF or the document confidence is less than `0.9`, with the following response:
   ```json
   {
     "error": "Invalid document. Please upload a valid PDF invoice with high confidence."
   }
   ```
4. The endpoint should return `503` status code if there is an error talking with the OCI Document AI service, as follows:
   ```json
   {
     "error": "The service is currently unavailable. Please try again later."
   }
   ```


### The `GET /invoice` endpoint

Add a new endpoint `GET /invoice/{invoice_id}` that retrieves the extracted invoice data from a database by its `invoice_id`. 

For example, let's say we have an invoice with ID `INV-2024-001` stored in the database.
When we call the endpoint like this:

```bash
curl http://localhost:8080/invoice/INV-2024-001
```

The response is:

```json
{
  "InvoiceId": "INV-2024-001",
  "VendorName": "Acme Corporation",
  "InvoiceDate": "2024-03-15",
  "BillingAddressRecipient": "John Doe",
  "ShippingAddress": "123 Main St, New York, NY 10001",
  "SubTotal": 850.00,
  "ShippingCost": 25.00,
  "InvoiceTotal": 875.00,
  "Items": [
    {
      "Description": "Professional Services - Web Development",
      "Name": "Web Dev Package",
      "Quantity": 10,
      "UnitPrice": 75.00,
      "Amount": 750.00
    },
    {
      "Description": "Consulting Services",
      "Name": "Strategy Consultation",
      "Quantity": 2,
      "UnitPrice": 50.00,
      "Amount": 100.00
    }
  ]
}
```

#### Notes

1. The endpoint should accept `invoice_id` as a path parameter in the request, for example:

```bash
# curl http://localhost:8080/invoice/{invoice_id}

curl http://localhost:8080/invoice/INV-2024-001
curl http://localhost:8080/invoice/123456
```

2. The endpoint should query the database to retrieve the invoice data.
   - If the given `invoice_id` does not exist in the database, it should return a `404` status code with the following response:
     ```json
     {
       "error": "Invoice not found"
     }
     ```
3. Feel free to add new functions in `db_util.py` to retrieve invoice data from the database (e.g., `get_invoice_by_id(invoice_id)`)



### The `GET /invoices/vendor/{vendor_name}` endpoint

Add a new endpoint `GET /invoices/vendor/{vendor_name}` that retrieves all invoices from a specific vendor.

For example, let's say we have multiple invoices from "SuperStore" stored in the database.
When we call the endpoint like this:

```bash
curl http://localhost:8080/invoices/vendor/SuperStore
```

The response is:

```json
{
  "VendorName": "SuperStore",
  "TotalInvoices": 2,
  "invoices": [
    {
      "InvoiceId": "123",
      "VendorName": "SuperStore",
      "....": "...."
    },
    {
      "InvoiceId": "456",
      "VendorName": "SuperStore",
      "....": "...."
    }
  ]
}
```

#### Notes

1. The endpoint should accept `vendor_name` as a path parameter.

2. The endpoint should query the database to retrieve all invoices from the specified vendor.
   - Each invoice in the list should include all the extracted fields as in the `GET /invoice/{invoice_id}` response.
   - The response should also include the `VendorName` and `TotalInvoices` count

3. If no invoices are found for the given vendor, return a `200` status code with an empty list:
   ```json
   {
     "VendorName": "Unknown Vendor",
     "TotalInvoices": 0,
     "invoices": []
   }
   ```

4. Consider creating a new function in `db_util.py` to retrieve invoices by vendor name (e.g., `get_invoices_by_vendor(vendor_name)`)


# Submission

Prepare a short 5 minutes presentation of your work.

- The demo must be **live**, i.e. you will run the app locally and show the new endpoints working.
- Be ready to answer questions, for example:
  - Your scheme design - fields type, which fields are required, which are optional
  - Python syntax questions - what this function does? what type of variable? etc.
  - Design questions - how would you suggest add a new element to the scheme? In which table to store it in the db?
  - Draw the SQLite table scheme
  - What happens if the user requests an invoice that does not exist?

# Good luck!
