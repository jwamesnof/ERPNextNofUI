"""
Mock API Data for OTP Tests

Provides consistent mock responses for:
- Health check endpoint
- Sales orders list
- Sales order details
- Stock data
- Promise evaluation
"""

from datetime import datetime

MOCK_HEALTH_RESPONSE = {
    "status": "healthy",
    "version": "1.0.0",
    "erpnext_connected": True,
    "timestamp": datetime.now().isoformat(),
}

MOCK_SALES_ORDERS_LIST = {
    "sales_orders": [
        {
            "name": "SAL-ORD-2026-00001",
            "customer": "Acme Corporation",
            "customer_name": "Acme Corporation",
            "so_date": "2026-02-01",
            "delivery_date": "2026-02-15",
            "item_count": 3,
            "grand_total": 15000.0,
            "status": "Draft",
        },
        {
            "name": "SAL-ORD-2026-00002",
            "customer": "Beta LLC",
            "customer_name": "Beta LLC",
            "so_date": "2026-02-02",
            "delivery_date": "2026-02-20",
            "item_count": 2,
            "grand_total": 8500.0,
            "status": "Draft",
        },
        {
            "name": "SAL-ORD-2026-00010",
            "customer": "Gamma Industries",
            "customer_name": "Gamma Industries",
            "so_date": "2026-02-03",
            "delivery_date": "2026-02-25",
            "item_count": 5,
            "grand_total": 22000.0,
            "status": "Draft",
        },
    ],
    "total": 3,
    "limit": 20,
    "offset": 0,
}

MOCK_SALES_ORDER_DETAILS_SAL_ORD_00001 = {
    "name": "SAL-ORD-2026-00001",
    "sales_order_id": "SAL-ORD-2026-00001",
    "customer": "Acme Corporation",
    "customer_name": "Acme Corporation",
    "transaction_date": "2026-02-01",
    "delivery_date": "2026-02-15",
    "status": "Draft",
    "items": [
        {
            "name": "SAL-ORD-2026-00001-0001",
            "item_code": "WIDGET-ALPHA",
            "item_name": "Widget Alpha",
            "description": "Premium alpha widget",
            "qty": 5,
            "uom": "NOS",
            "warehouse": "Stores - SD",
            "stock_actual": 20,
            "stock_reserved": 5,
            "stock_available": 15,
        },
        {
            "name": "SAL-ORD-2026-00001-0002",
            "item_code": "WIDGET-BETA",
            "item_name": "Widget Beta",
            "description": "Standard beta widget",
            "qty": 10,
            "uom": "NOS",
            "warehouse": "Stores - SD",
            "stock_actual": 50,
            "stock_reserved": 20,
            "stock_available": 30,
        },
        {
            "name": "SAL-ORD-2026-00001-0003",
            "item_code": "COMPONENT-X",
            "item_name": "Component X",
            "description": "Critical component",
            "qty": 3,
            "uom": "NOS",
            "warehouse": "Stores - SD",
            "stock_actual": 10,
            "stock_reserved": 0,
            "stock_available": 10,
        },
    ],
    "defaults": {
        "warehouse": "Stores - SD",
        "delivery_mode": "LATEST_ACCEPTABLE",
    },
}

MOCK_SALES_ORDER_DETAILS_SAL_ORD_00002 = {
    "name": "SAL-ORD-2026-00002",
    "sales_order_id": "SAL-ORD-2026-00002",
    "customer": "Beta LLC",
    "customer_name": "Beta LLC",
    "transaction_date": "2026-02-02",
    "delivery_date": "2026-02-20",
    "status": "Draft",
    "items": [
        {
            "name": "SAL-ORD-2026-00002-0001",
            "item_code": "COMPONENT-Y",
            "item_name": "Component Y",
            "description": "Secondary component",
            "qty": 8,
            "uom": "NOS",
            "warehouse": "Stores - SD",
            "stock_actual": 25,
            "stock_reserved": 10,
            "stock_available": 15,
        },
        {
            "name": "SAL-ORD-2026-00002-0002",
            "item_code": "GEAR-TYPE-A",
            "item_name": "Gear Type A",
            "description": "Standard gear",
            "qty": 6,
            "uom": "NOS",
            "warehouse": "Stores - SD",
            "stock_actual": 30,
            "stock_reserved": 6,
            "stock_available": 24,
        },
    ],
    "defaults": {
        "warehouse": "Stores - SD",
        "delivery_mode": "LATEST_ACCEPTABLE",
    },
}

MOCK_STOCK_DATA = {
    "items": [
        {
            "item_code": "WIDGET-ALPHA",
            "item_name": "Widget Alpha",
            "warehouses": [
                {
                    "warehouse": "Stores - SD",
                    "stock": 20,
                    "reserved": 5,
                    "available": 15,
                },
            ],
        },
        {
            "item_code": "WIDGET-BETA",
            "item_name": "Widget Beta",
            "warehouses": [
                {
                    "warehouse": "Stores - SD",
                    "stock": 50,
                    "reserved": 20,
                    "available": 30,
                },
            ],
        },
        {
            "item_code": "COMPONENT-X",
            "item_name": "Component X",
            "warehouses": [
                {
                    "warehouse": "Stores - SD",
                    "stock": 10,
                    "reserved": 0,
                    "available": 10,
                },
            ],
        },
        {
            "item_code": "COMPONENT-Y",
            "item_name": "Component Y",
            "warehouses": [
                {
                    "warehouse": "Stores - SD",
                    "stock": 25,
                    "reserved": 10,
                    "available": 15,
                },
            ],
        },
        {
            "item_code": "GEAR-TYPE-A",
            "item_name": "Gear Type A",
            "warehouses": [
                {
                    "warehouse": "Stores - SD",
                    "stock": 30,
                    "reserved": 6,
                    "available": 24,
                },
            ],
        },
    ],
}

MOCK_PROMISE_RESPONSE_SUCCESS = {
    "status": "OK",
    "promise_date": "2026-02-18",
    "promise_date_raw": "2026-02-17",
    "desired_date": "2026-02-15",
    "desired_date_mode": "LATEST_ACCEPTABLE",
    "on_time": False,
    "adjusted_due_to_no_early_delivery": False,
    "can_fulfill": True,
    "confidence": "HIGH",
    "plan": [
        {
            "item_code": "WIDGET-ALPHA",
            "qty_required": 5,
            "fulfillment": [
                {
                    "source": "stock",
                    "qty": 5,
                    "available_date": "2026-02-05",
                    "ship_ready_date": "2026-02-05",
                    "warehouse": "Stores - SD",
                }
            ],
            "shortage": 0,
        },
        {
            "item_code": "WIDGET-BETA",
            "qty_required": 10,
            "fulfillment": [
                {
                    "source": "stock",
                    "qty": 10,
                    "available_date": "2026-02-06",
                    "ship_ready_date": "2026-02-06",
                    "warehouse": "Stores - SD",
                }
            ],
            "shortage": 0,
        },
        {
            "item_code": "COMPONENT-X",
            "qty_required": 3,
            "fulfillment": [
                {
                    "source": "stock",
                    "qty": 3,
                    "available_date": "2026-02-05",
                    "ship_ready_date": "2026-02-05",
                    "warehouse": "Stores - SD",
                }
            ],
            "shortage": 0,
        },
    ],
    "reasons": [
        "All items available in warehouse",
        "Can fulfill by 2026-02-18",
        "Weekend adjustment applied",
    ],
    "blockers": [],
    "options": [],
}

MOCK_PROMISE_RESPONSE_AT_RISK = {
    "status": "CANNOT_PROMISE_RELIABLY",
    "promise_date": "2026-02-20",
    "promise_date_raw": "2026-02-20",
    "desired_date": "2026-02-15",
    "desired_date_mode": "LATEST_ACCEPTABLE",
    "on_time": False,
    "adjusted_due_to_no_early_delivery": False,
    "can_fulfill": False,
    "confidence": "LOW",
    "plan": [
        {
            "item_code": "COMPONENT-Y",
            "qty_required": 8,
            "fulfillment": [
                {
                    "source": "stock",
                    "qty": 5,
                    "available_date": "2026-02-05",
                    "ship_ready_date": "2026-02-05",
                    "warehouse": "Stores - SD",
                },
                {
                    "source": "purchase_order",
                    "qty": 3,
                    "available_date": "2026-02-20",
                    "ship_ready_date": "2026-02-20",
                    "warehouse": None,
                    "po_id": "PO-2026-001",
                    "expected_date": "2026-02-20",
                }
            ],
            "shortage": 0,
        },
    ],
    "reasons": [
        "Some items require purchase order",
    ],
    "blockers": [
        "Delivery at risk due to purchase order lead time",
    ],
    "options": [],
}

MOCK_PROMISE_RESPONSE_NOT_FEASIBLE = {
    "status": "CANNOT_FULFILL",
    "promise_date": None,
    "promise_date_raw": None,
    "desired_date": "2026-02-10",
    "desired_date_mode": "LATEST_ACCEPTABLE",
    "on_time": None,
    "adjusted_due_to_no_early_delivery": False,
    "can_fulfill": False,
    "confidence": "LOW",
    "plan": [
        {
            "item_code": "COMPONENT-Y",
            "qty_required": 20,
            "fulfillment": [
                {
                    "source": "stock",
                    "qty": 5,
                    "available_date": "2026-02-05",
                    "ship_ready_date": "2026-02-05",
                    "warehouse": "Stores - SD",
                }
            ],
            "shortage": 15,
        },
    ],
    "reasons": [
        "Insufficient stock for all items",
    ],
    "blockers": [
        "Desired date is in the past",
        "Insufficient inventory to fulfill order",
    ],
    "options": [],
}

VALID_ITEM_CODES = ["WIDGET-ALPHA", "WIDGET-BETA", "COMPONENT-X", "COMPONENT-Y", "GEAR-TYPE-A"]
INVALID_ITEM_CODE = "INVALID-ITEM-XYZ"
DEFAULT_WAREHOUSE = "Stores - SD"
