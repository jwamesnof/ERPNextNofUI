import anthropic
import os


with open('.anthropicKey', 'r') as file:
    api_key = file.read().strip()



# Initialize the Anthropic client
# Make sure to set your API key as an environment variable: ANTHROPIC_API_KEY
client = anthropic.Anthropic(
    api_key=api_key
)

customers = {
    "customers": [
        {"id": 1, "name": "Alice", "last_contacted": "2024-05-01", "unpaid_invoices": 0},
        {"id": 2, "name": "Bob", "last_contacted": "2024-04-15", "unpaid_invoices": 2},
        {"id": 3, "name": "Charlie", "last_contacted": "2024-03-20", "unpaid_invoices": 1},
        {"id": 4, "name": "Diana", "last_contacted": "2024-05-10", "unpaid_invoices": 0}
    ]
}  # to be fetched from DB or API
recent_notifications = [
    {"customer_id": 1, "date": "2024-05-01"},
    {"customer_id": 2, "date": "2024-04-15"},
    {"customer_id": 4, "date": "2024-05-10"}
]  # to be fetched from DB or API


prompt = f"""
You are a notification assistant. 

Below is a json with all my customers:

{customers}

Below is a list of recent notifications sent to customers:

{recent_notifications}

Based on the above information, provide a list of customers that should be notified accordign the following rules:

- Notify customers who have not been contacted in the last 30 days.
- Customers with unpaid invoices should be prioritized.


YOU MUST RESPOND IN JSON FORMAT AS FOLLOWS:

{{
    "to_notify": [
        {{
            "id": <customer_id>,
            "name": "<customer_name>",
            "reason": "<reason_for_notification>"
        }},
        ...
    ]
}}

For example: 
{{
    "to_notify": [
        {{
            "id": 2,
            "name": "Bob",
            "reason": "Not contacted in the last 30 days and has unpaid invoices"
        }},
        {{
            "id": 3,
            "name": "Charlie",
            "reason": "Not contacted in the last 30 days"
        }}
    ]
}}
"""

# Send a message to Claude
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1000,
    messages=[
        {
            "role": "user",
            "content": prompt
        }
    ]
)

# Print the response
print(message.content[0].text)

