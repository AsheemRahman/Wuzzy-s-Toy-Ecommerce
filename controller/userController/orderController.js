const orderSchema = require("../../model/orderSchema");
const userSchema = require("../../model/userSchema");
const mongoose = require("mongoose");
const productSchema = require("../../model/productSchema");
const walletSchema = require('../../model/walletSchema');

const PDFDocument = require('pdfkit-table')

const path = require('path');

//--------------------------------- user order page -----------------------------


const orderPage = async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            req.flash('error', "User not found. Please login again.");
            return res.redirect("/login");
        }
        const orderDetails = await orderSchema.find({ customer_id: user }).populate("products.product_id").sort({ updatedAt: -1 })
        res.render("user/orders", {
            title: "Orders",
            user,
            orderDetails
        });
    } catch (err) {
        console.error(`Error rendering the order page: ${err}`);
        req.flash("error", "Error rendering the order page, please Try again later.");
        res.redirect("/home");
    }
};


const cancelOrder = async (req, res) => {
    try {
        const user = req.session.user;
        const orderId = req.params.id;

        if (!orderId) {
            req.flash('error', 'Invalid order ID');
            return res.redirect('/orders');
        }
        const order = await orderSchema.findByIdAndUpdate(orderId, { orderStatus: "Cancelled", isCancelled: true });
        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/orders');
        }
        for (let product of order.products) {
            if (product.product_id && product.product_quantity !== undefined) {
                await productSchema.findByIdAndUpdate(product.product_id, { $inc: { productQuantity: product.product_quantity } });
            } else {
                console.error(`Invalid product data: ${JSON.stringify(product)}`);
                req.flash('error', 'Error updating product quantity');
                return res.redirect('/orders');
            }
        }
        req.flash('success', 'Order cancelled successfully');
        res.redirect('/orders');
    } catch (error) {
        console.error(`Error while cancelling the order: ${error}`);
        req.flash('error', 'Cannot cancel this order right now, please try again');
        res.redirect('/orders');
    }
};


const orderDetail = async (req,res) =>{
    const user =req.session.user
    const order_id = req.params.id;
    try{
        const orderDetails = await orderSchema.findOne({ _id : order_id})
        res.render('user/orderDetail',{ title:"Order view" , orderDetails , user })
    }
    catch(error){
        console.log(`Error while render Order view page in user ${error}`)
        res.redirect('/order')
    }
}

const returnOrder = async (req, res) => {
    try {
        const { orderId, returnReason } = req.body;

        if (!orderId || !returnReason) {
            return res.status(400).json({ status: 'error', message: 'Order ID and return reason are required' });
        }

        const order = await orderSchema.findById(orderId);

        if (!order) {
            return res.status(404).json({ status: 'error', message: 'Order not found' });
        }

        if (order.orderStatus === 'Returned' || order.orderStatus === 'Cancelled') {
            return res.status(400).json({ status: 'error', message: 'Order is already returned or cancelled' });
        }

        order.orderStatus = 'Returned';
        order.returnReason = returnReason;
        await order.save();

        if (order.paymentMethod === 'razorpay') {
            const userWallet = await walletSchema.findOne({ userID: order.customer_id });
            if (userWallet) {
                userWallet.balance = (userWallet.balance || 0) + order.totalPrice;
                userWallet.transaction.push({
                    wallet_amount: order.totalPrice,
                    order_id: orderId,
                    transactionType: 'Credited',
                    transaction_date: new Date()
                });
                await userWallet.save();
            } else {
                await walletSchema.create({
                    userID: order.customer_id,
                    balance: order.totalPrice,
                    transaction: [{
                        wallet_amount: order.totalPrice,
                        order_id: orderId,
                        transactionType: 'Credited',
                        transaction_date: new Date()
                    }]
                });
            }
        }
        return res.status(200).json({ status: 'success', message: 'Order return request submitted successfully' });
    } catch (error) {
        console.error('Error processing return request:', error);
        return res.status(500).json({ status: 'error', message: 'An error occurred while processing the return request' });
    }
};

const Invoice = async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            req.flash('error', "User not found. Please login again.");
            return res.redirect("/login");
        }
        const orderId = req.params.orderId;
        const orderDetails = await orderSchema.findById(orderId).populate('products.product_id')
        const doc = new PDFDocument();
        const filename = Invoice.pdf;

        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);

        // Add header aligned to center
        doc
            .font("Helvetica-Bold")
            .fontSize(36)
            .text("Wuzzys Toys", { align: "center", margin: 10 });
        doc
            .font("Helvetica-Bold")
            .fillColor("grey")
            .fontSize(8)
            .text("Where imagination meets fun, and every toy has a story.", {
                align: "center",
                margin: 10,
            });
        doc.moveDown();

        doc.fontSize(10).fillColor("blue").text(`Invoice #${orderDetails.order_id}`);
        doc.moveDown();
        doc.moveDown();

        doc
            .fillColor("black")
            .text(`Total products: ${orderDetails.totalQuantity}`);

        doc
            .fillColor("black")
            .text(`
                Shipping Charge: ${orderDetails.totalPrice < 1500 ? "RS 50" : "Free"}
            `);
        doc
            .fontSize(10)
            .fillColor("red")
            .text(`Total Amount: Rs ${orderDetails.totalPrice.toLocaleString()}`);
        doc.moveDown();

        doc
            .fontSize(10)
            .fillColor("black")
            .text(`Payment method: ${orderDetails.paymentMethod}`);
        doc.text(`Order Date: ${orderDetails.createdAt.toDateString()}`);
        doc.moveDown();
        doc.moveDown();

        doc
            .fontSize(10)
            .fillColor("black")
            .text( `Address: Sulthan Bathery,Wayanad`);
        doc.text(`Pincode: 673590`);
        doc.text(`Phone: 859 075 4230`);
        doc.moveDown();
        doc.moveDown();

        doc.fontSize(12).text("Invoice.", { align: "center", margin: 10 });
        doc.moveDown();

        const tableData = {
            headers: ["Product Name", "Quantity", "Price", "Product Discount", "Coupon Discount", "Total"],
            rows: orderDetails.products.map((product) => {
                const productName = product.product_name || "N/A";
                const quantity = product.product_quantity || 0;
                const price = product.product_price || 0;
                const discount = product.productDiscount || 0;
                const coupondiscount = orderDetails.couponDiscount || 0

                const total = Math.round((price * (1 - discount / 100) * quantity) - (coupondiscount).toFixed(2));

                return [
                    productName,
                    quantity,
                    `Rs ${price}`,
                    `${discount} %`,
                    `Rs${coupondiscount} `,
                    `Rs ${total}`,
                ];
            }),
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: (row, i) => doc.font("Helvetica").fontSize(8),
            hLineColor: "#b2b2b2",
            vLineColor: "#b2b2b2",
            textMargin: 2,
        });

        doc.moveDown();
        doc.moveDown();
        doc.moveDown();
        doc.moveDown();
        doc.fontSize(12).text("Thank You.", { align: "center", margin: 10 });
        doc.moveDown();

        doc.end();
    } catch (err) {
        console.log(`Error on downloading the invoice pdf ${err}`);
        res.status(500).send("Error generating invoice");

    }
};


module.exports = { orderPage , cancelOrder , orderDetail , returnOrder , Invoice }