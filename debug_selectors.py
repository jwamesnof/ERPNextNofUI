"""Debug script to inspect actual HTML elements on the running app"""
import time
from playwright.sync_api import sync_playwright

def inspect_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(1)
        
        # Save HTML to file for inspection
        html = page.content()
        with open("page_content.html", "w", encoding="utf-8") as f:
            f.write(html)
        
        print("✓ Saved page HTML to page_content.html")
        
        # Print key element info
        print("\n=== CUSTOMER INPUT ===")
        cust = page.query_selector("input#customer")
        if cust:
            print(f"✓ Found with: input#customer")
            print(f"  Attributes: {cust.get_attribute('class')}")
        else:
            print("✗ Not found")
        
        print("\n=== ADD ITEM BUTTON ===")
        add_btns = page.query_selector_all("button")
        for btn in add_btns:
            if btn.inner_text() and "Add Item" in btn.inner_text():
                print(f"✓ Found button with text: 'Add Item'")
                print(f"  Full HTML: {btn.evaluate('el => el.outerHTML')[:300]}")
                break
        
        print("\n=== EVALUATE PROMISE BUTTON ===")
        for btn in add_btns:
            if btn.inner_text() and "Evaluate Promise" in btn.inner_text():
                print(f"✓ Found button with text: 'Evaluate Promise'")
                print(f"  Classes: {btn.get_attribute('class')[:150]}")
                break
        
        print("\n=== ALL DATA-TESTID ATTRIBUTES ===")
        testids = page.query_selector_all("[data-testid]")
        for elem in testids:
            testid = elem.get_attribute("data-testid")
            tag = elem.get_property("tagName").json_value()
            print(f"  <{tag}> data-testid='{testid}'")
        
        print(f"\n=== SUMMARY ===")
        print(f"Total inputs: {len(page.query_selector_all('input'))}")
        print(f"Total buttons: {len(page.query_selector_all('button'))}")
        print(f"Total data-testid elements: {len(testids)}")
        
        browser.close()

if __name__ == "__main__":
    inspect_page()
