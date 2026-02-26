import fs from 'fs';

const targetFile = 'c:\\Users\\anush\\OneDrive\\Desktop\\Programming\\paxio-landing\\backend\\agents\\mainAgent.ts';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update shopping platforms
content = content.replace(
    'const shoppingPlatforms = ["zepto"] as const;',
    'const shoppingPlatforms = ["zepto", "blinkit"] as const;'
);

// 2. Add BlinkitSessionInfo
if (!content.includes('interface BlinkitSessionInfo')) {
    content = content.replace(
        'interface ZeptoSessionInfo {\n    sessionId: string;\n    shareUrl: string;\n    liveUrl?: string;\n    product: string;\n    location: string;\n    phoneNumber: string;\n    createdAt: string;\n}',
        'interface ZeptoSessionInfo {\n    sessionId: string;\n    shareUrl: string;\n    liveUrl?: string;\n    product: string;\n    location: string;\n    phoneNumber: string;\n    createdAt: string;\n}\n\ninterface BlinkitSessionInfo {\n    sessionId: string;\n    shareUrl: string;\n    liveUrl?: string;\n    product: string;\n    location: string;\n    phoneNumber: string;\n    createdAt: string;\n}'
    );
}

// 3. Duplicate and modify the zepto_order tool
const toolStartMarker = '// Zepto Shopping Tool';
const toolEndMarker = 'return tools;\n}';

const startIndex = content.indexOf(toolStartMarker);
const endIndex = content.indexOf(toolEndMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1 && !content.includes('Blinkit Shopping Tool')) {
    let zeptoBlock = content.substring(startIndex, endIndex);

    // Copy and replace Zepto -> Blinkit specifically
    let blinkitBlock = zeptoBlock
        .replace(/Zepto/g, 'Blinkit')
        .replace(/zepto/g, 'blinkit')
        .replace(/https:\/\/www\.zeptonow\.com\//g, 'https://blinkit.com/')
        .replace(/https:\/\/www\.zeptonow\.com\/search/g, 'https://blinkit.com/s/');

    // Update Blinkit Phase 1
    blinkitBlock = blinkitBlock.replace(
        `1. Go to https://blinkit.com/
2. Click "Select Location" button.
3. In the location box, enter "\${location}" and choose the closest option.
4. Click confirm and continue.
5. Click login button, enter the phone number: \${phone_number} into the input field.
6. Click 'Continue' to send the OTP.
7. STOP immediately after the OTP is sent and the OTP input field is visible.`,
        `1. Go to https://blinkit.com/
2. If location modal is not visible, click the "Select Location" area in the header.
3. In the location search modal, locate the input field with placeholder "search delivery location".
4. Type "\${location}" and click the correct address from the auto-suggestions. Wait for page to refresh.
5. Click the "Login" button at the top right of the header.
6. In the login modal, click the input field with placeholder "Enter mobile number" and type \${phone_number}.
7. Click the green "Continue" button below the input field.
8. STOP immediately after the OTP is sent and the 4-digit OTP input field is visible.`
    );

    // Update Blinkit Phase 2
    blinkitBlock = blinkitBlock.replace(
        `PRE-CONDITION: You are viewing the OTP input field on Blinkit website.

1. Enter the following OTP: \${otp} into the visible OTP field.
2. Click submit to finish the login process.
3. Wait until the page successfully redirects after login.
4. If any popup appears, close it by clicking the cross button.
5. Confirm you are logged in successfully.`,
        `PRE-CONDITION: You are viewing the OTP input field on Blinkit website.

1. Enter the following OTP: \${otp} into the visible OTP field.
2. If any popup appears, close it.
3. Confirm you are logged in successfully.`
    );

    // Update Blinkit Phase 3
    blinkitBlock = blinkitBlock.replace(
        `PRE-CONDITION: You are logged in on Blinkit.

1. Go to https://blinkit.com/s/
2. Search for the product "\${resolvedProduct}" using the main search bar.
3. After finding the product that best matches "\${resolvedProduct}", click the ADD button to put it in the cart.
4. Take a screenshot of the product page.
5. Navigate to the cart by clicking the cart icon.
6. Confirm the product is in the cart.`,
        `PRE-CONDITION: You are logged in on Blinkit.

1. Click the search bar in the header to navigate to the search page.
2. Type "\${resolvedProduct}" into the search input field and press Enter.
3. Find the desired product card and click the green "ADD" button on it.
4. Take a screenshot of the product page.
5. The cart value in the top header should show 1 item.`
    );

    // Update Blinkit Phase 4
    blinkitBlock = blinkitBlock.replace(
        `PRE-CONDITION: You are logged in and have an item in the cart on Blinkit.

1. Click on the cart to view cart items.
2. Click "Add Address" or proceed to checkout.
3. Click "Confirm and Continue".
4. Enter address details:
   - Address: \${deliveryDetails.address}
5. Click "Save Address".
6. Proceed to payment.
7. Select UPI as payment method.
8. Enter UPI ID: \${deliveryDetails.upiId}
9. Click "Verify and Pay" or "Pay" button.
10. Wait for the payment to be processed.
11. If there is a UPI payment request, proceed with it.
12. Take a screenshot of the final payment confirmation or order confirmation screen.`,
        `PRE-CONDITION: You are logged in and have an item in the cart on Blinkit.

1. Click the Cart button in the header (shows item count and price).
2. A side panel "My Cart" slides in. Click the large green "Proceed to Checkout" button at the bottom.
3. Click "Add New Address".
4. Enter address details:
   - Address: \${deliveryDetails.address}
5. Click "Save and Proceed".
6. On the payment methods page, locate and select the "UPI" option.
7. Select "Add new UPI ID".
8. Enter UPI ID: \${deliveryDetails.upiId}
9. Click "Verify and Pay".
10. Wait for payment processing.
11. Take a screenshot of the final payment confirmation or order confirmation screen.`
    );

    // Insert Blinkit block right before "return tools;"
    const newToolsBody = zeptoBlock + '\n\n    // Blinkit Shopping Tool\n' + blinkitBlock.replace('// Zepto Shopping Tool\n', '');
    content = content.replace(zeptoBlock, newToolsBody);
}

// 4. Update delivery context block
if (!content.includes('=== BLINKIT DELIVERY CONTEXT ===') && content.includes('=== ZEPTO DELIVERY CONTEXT ===')) {
    const contextLogicToReplace = `    const zeptoConfigured = !!(delivery.phone && delivery.address && delivery.upi);

    let deliveryContext = "";
    if (zeptoConfigured) {
        deliveryContext = \`
=== ZEPTO DELIVERY CONTEXT ===
The user has configured the following delivery details for Zepto. 
Use these values automatically when calling the zepto_order tool. DO NOT ask the user for them.
- Address: "\${delivery.address}"
- Phone: "\${delivery.phone}"
- UPI ID: "\${delivery.upi}"
==============================
\`;
    } else {
        deliveryContext = \`
=== ZEPTO DELIVERY CONTEXT ===
⚠️ ZEPTO NOT CONFIGURED.
The user has NOT set up their delivery address or phone number in the database.
If the user asks to order/buy something from Zepto:
1. DO NOT call the zepto_order tool.
2. DO NOT ask them for address/phone details.
3. You MUST EXPLAIN to the user that they need to configure their Zepto delivery details (Address, Phone, UPI) in the tools menu first. Do NOT use a hardcoded string. Generate a helpful, natural explanation.
==============================
\`;
    }`;

    const newContextLogic = `    const zeptoConfigured = !!(delivery.phone && delivery.address && delivery.upi);
    const blinkitConfigured = !!(delivery.phone && delivery.address && delivery.upi);

    let deliveryContext = "";
    if (zeptoConfigured) {
        deliveryContext += \`
=== ZEPTO DELIVERY CONTEXT ===
The user has configured the following delivery details for Zepto. 
Use these values automatically when calling the zepto_order tool. DO NOT ask the user for them.
- Address: "\${delivery.address}"
- Phone: "\${delivery.phone}"
- UPI ID: "\${delivery.upi}"
==============================
\`;
    } else {
        deliveryContext += \`
=== ZEPTO DELIVERY CONTEXT ===
⚠️ ZEPTO NOT CONFIGURED.
The user has NOT set up their delivery address or phone number in the database.
If the user asks to order/buy something from Zepto:
1. DO NOT call the zepto_order tool.
2. DO NOT ask them for address/phone details.
3. You MUST EXPLAIN to the user that they need to configure their Zepto delivery details (Address, Phone, UPI) in the tools menu first. Do NOT use a hardcoded string. Generate a helpful, natural explanation.
==============================
\`;
    }

    if (blinkitConfigured) {
        deliveryContext += \`
=== BLINKIT DELIVERY CONTEXT ===
The user has configured the following delivery details for Blinkit. 
Use these values automatically when calling the blinkit_order tool. DO NOT ask the user for them.
- Address: "\${delivery.address}"
- Phone: "\${delivery.phone}"
- UPI ID: "\${delivery.upi}"
==============================
\`;
    } else {
        deliveryContext += \`
=== BLINKIT DELIVERY CONTEXT ===
⚠️ BLINKIT NOT CONFIGURED.
The user has NOT set up their delivery address or phone number in the database.
If the user asks to order/buy something from Blinkit:
1. DO NOT call the blinkit_order tool.
2. DO NOT ask them for address/phone details.
3. You MUST EXPLAIN to the user that they need to configure their Zepto/Blinkit delivery details (Address, Phone, UPI) in the tools menu first. Do NOT use a hardcoded string. Generate a helpful, natural explanation.
==============================
\`;
    }`;

    content = content.replace(contextLogicToReplace, newContextLogic);
}

// 5. Update prompt constraints around zepto_order to also mention blinkit_order
content = content.replace(
    '7. If user asks to order, buy, or shop for groceries/products from Zepto → use the zepto_order tool\n   - WHEN USER PROVIDES OTP: You MUST call zepto_order again with the SAME location, phone_number, product, and the otp they provide.\n   - **OTP DETECTION**: If the RECENT CONVERSATION shows "awaiting_otp" or "OTP sent" for a Zepto order, ALWAYS attempt to parse user next message as an OTP and call zepto_order.',
    '7. If user asks to order, buy, or shop for groceries/products from Zepto or Blinkit → use the zepto_order or blinkit_order tool\n   - WHEN USER PROVIDES OTP: You MUST call the corresponding tool again with the SAME location, phone_number, product, and the otp they provide.\n   - **OTP DETECTION**: If the RECENT CONVERSATION shows "awaiting_otp" or "OTP sent" for a Zepto/Blinkit order, ALWAYS attempt to parse user next message as an OTP and call the corresponding tool.'
);

content = content.replace(
    'Zepto Context:',
    'Delivery Context:'
);

fs.writeFileSync(targetFile, content);
console.log('Successfully injected Blinkit tool into mainAgent.ts');
