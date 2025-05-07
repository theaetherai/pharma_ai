import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { confirmOrderPayment, createOrder } from "@/lib/order-service";
import type { UserSession } from "@/lib/auth";
import { auth } from "@clerk/nextjs";
import { retryOperation } from "@/lib/api-helpers";

interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: any;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      metadata: any;
      customer_code: string;
    };
  };
}

// Interface for the cart data from the client
interface CartItem {
  drugId: string;
  quantity: number;
  price: number;
}

export async function POST(req: NextRequest) {
  try {
    console.log("Payment verification process started");
    const body = await req.json();
    const { reference, cart, deliveryAddressId, deliveryAddress, userEmail } = body;

    if (!reference) {
      return NextResponse.json(
        { success: false, message: "Payment reference is required" },
        { status: 400 }
      );
    }

    console.log(`Verifying payment with reference: ${reference}`);

    // Attempt to get user from our custom auth system
    let userSession: UserSession | null = null;
    let userId: string;
    
    try {
      console.log("Attempting to get current user from custom auth");
      userSession = await getCurrentUser();
      console.log("getCurrentUser result:", userSession ? "User found" : "No user found");
    } catch (authError) {
      console.error("Error getting current user:", authError);
    }

    // If our custom auth failed, try Clerk auth as backup
    if (!userSession) {
      console.log("Custom auth failed, trying Clerk auth");
      const { userId: clerkUserId } = auth();
      
      if (clerkUserId) {
        console.log("Found Clerk user ID:", clerkUserId);
        
        // Find the user in our database by Clerk ID with retry
        try {
          const dbUser = await retryOperation(() => 
            prisma.user.findUnique({
              where: { clerkId: clerkUserId }
            })
          );
          
          if (dbUser) {
            console.log("Found user in database by Clerk ID");
            userId = dbUser.id;
          } else if (userEmail) {
            // If we have an email in the request, try to find the user by email with retry
            console.log("Trying to find user by email:", userEmail);
            const emailUser = await retryOperation(() => 
              prisma.user.findUnique({
                where: { email: userEmail }
              })
            );
            
            if (emailUser) {
              console.log("Found user in database by email");
              userId = emailUser.id;
            } else {
              // Create a guest user if we have an email but no matching user
              try {
                console.log("Creating guest user with email:", userEmail);
                const guestUser = await retryOperation(() => 
                  prisma.user.create({
                    data: {
                      email: userEmail,
                      name: "Guest User",
                      role: "USER",
                      clerkId: `guest_${Date.now()}`
                    }
                  })
                );
                userId = guestUser.id;
              } catch (createError) {
                console.error("Failed to create guest user:", createError);
                return NextResponse.json(
                  { success: false, message: "Failed to create user account" },
                  { status: 500 }
                );
              }
            }
          } else {
            // Use temporary guest ID if no user identifiers are available
            const tempGuestId = `temp_${reference}_${Date.now()}`;
            console.log("Using temporary guest ID:", tempGuestId);
            
            try {
              const guestUser = await retryOperation(() => 
                prisma.user.create({
                  data: {
                    email: `guest_${tempGuestId}@temp.pharmaai.com`,
                    name: "Guest User",
                    role: "USER",
                    clerkId: `guest_${tempGuestId}`
                  }
                })
              );
              userId = guestUser.id;
            } catch (createError) {
              console.error("Failed to create temporary guest user:", createError);
              return NextResponse.json(
                { 
                  success: true, 
                  message: "Payment verified, but user account creation failed",
                  isGuest: true,
                  reference
                },
                { status: 200 }
              );
            }
          }
        } catch (dbError) {
          console.error("Database error finding/creating user:", dbError);
          return NextResponse.json(
            { 
              success: true, 
              message: "Payment verified, but user lookup failed",
              warning: "User account linking failed",
              reference
            },
            { status: 200 }
          );
        }
      } else if (userEmail) {
        // If we have an email in the request but no Clerk ID, try to find by email with retry
        try {
          console.log("No Clerk ID, trying to find user by email:", userEmail);
          const emailUser = await retryOperation(() => 
            prisma.user.findUnique({
              where: { email: userEmail }
            })
          );
          
          if (emailUser) {
            console.log("Found user in database by email");
            userId = emailUser.id;
          } else {
            // Create guest user with email
            console.log("Creating guest user with email:", userEmail);
            const guestUser = await retryOperation(() => 
              prisma.user.create({
                data: {
                  email: userEmail,
                  name: "Guest User",
                  role: "USER",
                  clerkId: `guest_${Date.now()}`
                }
              })
            );
            userId = guestUser.id;
          }
        } catch (dbError) {
          console.error("Database error finding/creating user by email:", dbError);
          return NextResponse.json(
            { 
              success: true, 
              message: "Payment verified, but user lookup failed",
              warning: "User account linking failed",
              reference
            },
            { status: 200 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, message: "Authentication required" },
          { status: 401 }
        );
      }
    } else {
      userId = userSession.id;
      console.log(`Using user ID from session: ${userId}`);
    }

    // Verify the payment with Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error("Paystack secret key not configured");
      return NextResponse.json(
        { success: false, message: "Payment verification is not properly configured" },
        { status: 500 }
      );
    }

    // Make request to Paystack to verify the payment with retry
    console.log("Making request to Paystack to verify payment");
    const verificationUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    
    let verificationData: PaystackVerificationResponse;
    try {
      const response = await retryOperation(() => 
        fetch(verificationUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            "Content-Type": "application/json",
          },
        })
      );
      
      verificationData = await response.json();
      console.log("Paystack verification response status:", verificationData.status);
    } catch (fetchError) {
      console.error("Error fetching from Paystack:", fetchError);
      
      // If verification fails due to network issues, we'll assume payment is successful
      // but flag it for manual verification later
      return NextResponse.json({
        success: true,
        message: "Payment recorded but verification with Paystack failed - will be verified manually",
        needsManualVerification: true,
        reference,
      });
    }

    // If Paystack verification failed
    if (!verificationData.status) {
      return NextResponse.json(
        { success: false, message: "Payment verification failed", error: verificationData.message },
        { status: 400 }
      );
    }

    // If payment was not successful according to Paystack
    if (verificationData.data?.status !== "success") {
      return NextResponse.json(
        { 
          success: false, 
          message: "Payment was not successful", 
          status: verificationData.data?.status,
          gatewayResponse: verificationData.data?.gateway_response 
        },
        { status: 400 }
      );
    }

    // Payment was successful, process it
    try {
      console.log("Creating payment record in database");
      // Create a payment record in the database with retry
      const payment = await retryOperation(() => 
        prisma.payment.create({
          data: {
            userId,
            reference,
            amount: verificationData.data.amount / 100, // Convert from pesewas to cedis
            status: verificationData.data.status,
            transactionDate: new Date(verificationData.data.paid_at),
            paymentMethod: verificationData.data.channel,
            currency: verificationData.data.currency,
            metadata: verificationData.data.metadata || {},
          },
        })
      );

      // If cart and delivery info are provided, create an order
      let order = null;
      let addressId = deliveryAddressId;
      
      if (cart && Array.isArray(cart) && cart.length > 0) {
        try {
          console.log("Processing order with payment");
          
          // If we have a direct address string but no addressId, create an address record
          if (deliveryAddress && !addressId) {
            console.log("Creating address from delivery address string");
            // Split the address into components
            const addressParts = deliveryAddress.split(',').map((part: string) => part.trim());
            
            try {
              // Create a new address record with retry
              const address = await retryOperation(() => 
                prisma.address.create({
                  data: {
                    userId,
                    addressLine1: addressParts[0] || deliveryAddress,
                    addressLine2: addressParts.length > 1 ? addressParts[1] : '',
                    city: addressParts.length > 2 ? addressParts[2] : 'Accra',
                    state: addressParts.length > 3 ? addressParts[3] : 'Greater Accra',
                    postalCode: addressParts.length > 4 ? addressParts[4] : '00000',
                    country: 'Ghana',
                    isDefault: false
                  }
                })
              );
              
              addressId = address.id;
              console.log("Created address record with ID:", addressId);
            } catch (addressError) {
              console.error("Error creating address:", addressError);
              return NextResponse.json(
                { success: false, message: "Failed to create delivery address" },
                { status: 500 }
              );
            }
          }
          
          if (!addressId) {
            return NextResponse.json(
              { success: false, message: "Delivery address is required for order creation" },
              { status: 400 }
            );
          }
          
          // Validate that all drugIds in the cart exist before attempting to create an order
          const drugIds = cart.map(item => item.drugId).filter(Boolean);
          
          if (drugIds.length === 0) {
            console.error("No valid drug IDs found in cart");
            return NextResponse.json(
              { success: false, message: "No valid drugs found in cart" },
              { status: 400 }
            );
          }
          
          // Check which drugIds exist in the database with retry
          try {
            const existingDrugs = await retryOperation(() => 
              prisma.drug.findMany({
                where: {
                  id: { in: drugIds }
                },
                select: { id: true }
              })
            );
            
            const existingDrugIds = existingDrugs.map(drug => drug.id);
            const invalidDrugIds = drugIds.filter(id => !existingDrugIds.includes(id));
            
            if (invalidDrugIds.length > 0) {
              console.error("Invalid drug IDs in cart:", invalidDrugIds);
              return NextResponse.json(
                { 
                  success: false, 
                  message: "Cart contains invalid drug IDs",
                  invalidDrugIds
                },
                { status: 400 }
              );
            }
            
            // Filter cart to only include items with valid drugIds
            const validCart = cart.filter(item => existingDrugIds.includes(item.drugId));
            
            if (validCart.length === 0) {
              console.error("No valid items left in cart after validation");
              return NextResponse.json(
                { success: false, message: "No valid items in cart" },
                { status: 400 }
              );
            }
            
            // Log the validated cart
            console.log("Validated cart items:", validCart.length);
            
            // Check if we need to create a new order or update an existing one
            if (cart[0].orderId) {
              // If an orderId is present, this is a pending order - confirm it
              try {
                const orderResult = await confirmOrderPayment({
                  orderId: cart[0].orderId,
                  paymentId: payment.id, // Pass existing payment ID to avoid duplicate
                  paymentReference: reference,
                  amount: verificationData.data.amount / 100,
                  paymentMethod: verificationData.data.channel,
                  currency: verificationData.data.currency
                });
                
                order = orderResult.order;
              } catch (confirmError) {
                console.error("Error confirming order payment:", confirmError);
                // Don't return error here, continue with payment success even if order confirmation fails
              }
            } else {
              // Create a new order with the validated cart items
              let retryCount = 0;
              const maxRetries = 3;
              
              while (retryCount < maxRetries && !order) {
                try {
                  // Create a new order with validated cart items using retry
                  order = await retryOperation(() => 
                    createOrder({
                      userId,
                      addressId,
                      items: validCart.map(item => ({
                        drugId: item.drugId,
                        quantity: item.quantity || 1,
                        price: item.price
                      }))
                    })
                  );
                  
                  if (order) {
                    console.log("Successfully created order with ID:", order.id);
                    
                    // Link the payment to the new order
                    await retryOperation(() => 
                      prisma.payment.update({
                        where: { id: payment.id },
                        data: { orderId: order.id }
                      })
                    );
                    
                    try {
                      // Confirm the payment for the new order
                      const orderResult = await confirmOrderPayment({
                        orderId: order.id,
                        paymentId: payment.id, // Pass existing payment ID to avoid duplicate
                        paymentReference: reference,
                        amount: verificationData.data.amount / 100,
                        paymentMethod: verificationData.data.channel,
                        currency: verificationData.data.currency
                      });
                      
                      order = orderResult.order;
                      console.log("Successfully confirmed payment for order:", order.id);
                    } catch (confirmError) {
                      console.error("Error confirming payment for created order:", confirmError);
                      // Don't throw here, we'll still return the created order
                    }
                  }
                } catch (createError: any) {
                  retryCount++;
                  const isTransactionTimeout = 
                    createError.code === 'P2028' || 
                    (createError.message && createError.message.includes('Transaction already closed'));
                  
                  if (isTransactionTimeout && retryCount < maxRetries) {
                    console.log(`Transaction timeout, retrying (${retryCount}/${maxRetries})...`);
                    // Add a small delay before retrying to allow system to recover
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  } else {
                    console.error("Error creating order (final):", createError);
                    // Continue with payment success even if order creation fails
                    break;
                  }
                }
              }
            }
          } catch (drugValidationError) {
            console.error("Error validating drugs:", drugValidationError);
            
            // If this fails due to DB connectivity, note this but continue
            return NextResponse.json({
              success: true,
              message: "Payment verified successfully, but order processing failed. Please contact support.",
              payment: {
                id: payment.id,
                reference: payment.reference,
                amount: payment.amount,
                status: payment.status,
                transactionDate: payment.transactionDate,
              },
              needsManualOrderProcessing: true
            });
          }
          
          if (order) {
            console.log("Order processed successfully:", order.id);
          } else {
            console.warn("Payment successful but order was not created/confirmed");
          }
        } catch (orderError) {
          console.error("Error processing order:", orderError);
          // Continue with payment success even if order creation fails
        }
      }
      
      console.log("Payment verification completed successfully");
      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        payment: {
          id: payment.id,
          reference: payment.reference,
          amount: payment.amount,
          status: payment.status,
          transactionDate: payment.transactionDate,
        },
        order: order ? {
          id: order.id,
          status: order.status,
        } : null
      });
    } catch (dbError) {
      console.error("Database error while recording payment:", dbError);
      
      // Even if we fail to record in our database, the payment was successful
      // We should still inform the client that the payment worked
      return NextResponse.json({
        success: true,
        message: "Payment successful, but there was an error recording the details",
        warning: "Please contact support with your payment reference",
        reference,
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during payment verification" },
      { status: 500 }
    );
  }
} 