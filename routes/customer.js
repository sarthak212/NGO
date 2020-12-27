require('dotenv').config()
const express = require('express');
const router = express.Router();
const common = require('../lib/common');
const colors = require('colors');
const randtoken = require('rand-token');
const bcrypt = require('bcryptjs');
const {
    getId,
    clearSessionValue,
    getCountryList,
    mongoSanitize,
    sendEmail,
    clearCustomer
} = require('../lib/common');
const Razorpay = require('razorpay');
const multer = require('multer');
const fs = require('fs');
var crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { indexCustomers } = require('../lib/indexing');
const { validateJson } = require('../lib/schema');
const { restrict } = require('../lib/auth');
var cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: 'du7p7keyx', 
    api_key: '164318297713199', 
    api_secret: '2g30sfZK2C3k_q5PElxXYhW1zhs' 
  });

//*********************************//
var keyid = "rzp_test_53E7dptbzQXAlj";
var keysecret = "gBk4CcD6kDZnoyZ9GssbCRec";
var instance = new Razorpay({
    key_id: keyid,
    key_secret: keysecret
  })

const authy = require('authy')(process.env.Authy_Key);

const apiLimiter = rateLimit({
    windowMs: 300000, // 5 minutes
    max: 5
});

router.get('/customer/register',async function(req, res) {
    const config = req.app.config;
    const db = req.app.db;
	console.log('New register request...');
    var paidcourse = await db.products.find({productPublished: common.convertBool(true)}).toArray();
    var unpaidcourse = await db.products.find({productPublished: common.convertBool(false)}).toArray();
    res.render(`${config.themeViews}register`, {
        title: 'User Registration',
        config: req.app.config,
        session: req.session,
        paidcourse: paidcourse,
        unpaidcourse: unpaidcourse,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: 'showFooter'
    });
});
const upload2 = multer({ dest: 'public/uploads/' });
router.post('/customer/register',upload2.fields([{ name: 'uploadFile10', maxCount: 1 },{ name: 'uploadFile12', maxCount: 1 },{ name: 'uploadFilephoto', maxCount: 1 },{ name: 'uploadFilesign', maxCount: 1 }]), async function(req,res)
{
    const config = req.app.config;
    const db = req.app.db;
    
    var files = req.files;
    console.log(files);
    
    if(files.uploadFile10.length != 1 || files.uploadFilephoto.length != 1 || files.uploadFilesign.length != 1) {
        req.session.message = "First Marksheet, Photo and Sign Files Required";
        req.session.messageType = 'danger';
        res.redirect('/customer/register');
        return;
    }
    var customerObj = Object(req.body);
    
      
            try{
                const newCustomer = await db.customers.insertOne(customerObj);
                indexCustomers(req.app)
                .then(async () => {
                    // Return the new customer
                    const customerReturn = newCustomer.ops[0];
        
                    // Set the customer into the session
                    req.session.customerPresent = true;
                    req.session.customerId = customerReturn._id;
                    req.session.customerFirstname = customerReturn.Name;
                    req.session.customerFathername = customerReturn.Father;
                    req.session.customerMothername = customerReturn.Mother;
                    req.session.customerAddhar = customerReturn.Addhar;
                    var customerId = req.session.customerId;
                    cloudinary.uploader.upload(files.uploadFile10[0].path,
                        async function(error, result) {
                            if(result){
                                console.log(result);
                                var json_String = JSON.stringify(result);
                                var obj = JSON.parse(json_String);
                               
                               
                                var uploadobj = {
                                    id: obj.public_id,
                                    path : obj.secure_url,
                                    type: obj.format
                                };
                                await db.customers.findOneAndUpdate({_id: getId(customerId)},{$set: {marksheet10: uploadobj}});
                                fs.unlinkSync(files.uploadFile10[0].path);
                            }
                            else {
                                fs.unlinkSync(files.uploadFile10[0].path);
                            }
                        });
                        if(files.uploadFile12) {
                    cloudinary.uploader.upload(files.uploadFile12[0].path,
                        async function(error, result) {
                            if(result){
                                console.log(result);
                                var json_String = JSON.stringify(result);
                                var obj = JSON.parse(json_String);
                                
                                
                                var uploadobj = {
                                    id: obj.public_id,
                                    path : obj.secure_url,
                                    type: obj.format
                                };
                                await db.customers.findOneAndUpdate({_id: getId(customerId)},{$set: {marksheet12: uploadobj}});
                                fs.unlinkSync(files.uploadFile12[0].path);
                            }
                            else {
                                fs.unlinkSync(files.uploadFile12[0].path);
                            }
                        });
                    }
                    if(files.uploadFilephoto){
                    cloudinary.uploader.upload(files.uploadFilephoto[0].path,
                        async function(error, result) {
                            if(result){
                                console.log(result);
                                var json_String = JSON.stringify(result);
                                var obj = JSON.parse(json_String);
                                
                               
                                var uploadobj = {
                                    id: obj.public_id,
                                    path : obj.secure_url,
                                    type: obj.format
                                };
                                await db.customers.findOneAndUpdate({_id: getId(customerId)},{$set: {photo: uploadobj}});
                                fs.unlinkSync(files.uploadFilephoto[0].path);
                            }
                            else {
                                fs.unlinkSync(files.uploadFilephoto[0].path);
                            }
                        });
                    }
                    if(files.uploadFilesign){
                    cloudinary.uploader.upload(files.uploadFilesign[0].path,
                        async function(error, result) {
                            if(result){
                                console.log(result);
                                var json_String = JSON.stringify(result);
                                var obj = JSON.parse(json_String);
                                
                               
                                var uploadobj = {
                                    id: obj.public_id,
                                    path : obj.secure_url,
                                    type: obj.format
                                };
                                await db.customers.findOneAndUpdate({_id: getId(customerId)},{$set: {sign: uploadobj}});
                                fs.unlinkSync(files.uploadFilesign[0].path);
                            }
                            else {
                                fs.unlinkSync(files.uploadFilesign[0].path);
                            }
                        });
                    }
                    console.log(customerObj.skills);
                    if(customerObj.skills) {
                        await db.customers.findOneAndUpdate({_id: getId(customerId)},{$set: {Paid: "Unpaid"}});
                        res.redirect(`/customer/payment/`+req.session.customerId);
                    }
                    else {
                        await db.customers.findOneAndUpdate({_id: getId(customerId)},{$set: {Paid: "Paid"}});
                        res.redirect('/customer/registered');
                    }
                    
                });
                
            }catch(ex){
                console.error(colors.red('Failed to insert customer: ', ex));
                res.status(400).json({
                    message: 'Customer creation failed.'
                });
            }

});

router.get('/customer/payment/:orderId',async (req,res)=>{
    const config = req.app.config;
    const db = req.app.db;

    const order = await db.customers.findOne({_id: getId(req.params.orderId)});
    if(!order){
        req.session.message = "Customer not found";
        req.session.messageType = "danger";
        res.redirect('/customer/register');
        return;
    }
    if(order.Paid == "Paid"){
        
            req.session.message = "Already Paid";
            req.session.messageType = "danger";
            res.redirect('/customer/registered');
            return;
        
    }
    var totalAmount = 0;
    var courselist = [];
    if(order.skills instanceof Array){
        for(var i = 0;i<order.skills.length;i++) {
            var course = await db.products.findOne({_id: getId(order.skills[i])});
            courselist.push(course);
            totalAmount += parseInt(course.price);
        }
    }
    else {
        var course = await db.products.findOne({_id: getId(order.skills)});
        courselist.push(course);
        totalAmount = parseInt(course.productPrice);
    }
    var amount = parseInt(Number(totalAmount) * 100);
    var options = {
        amount: amount,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "rcptid_11"
      };
      req.session.razorpayamount = amount;
      instance.orders.create(options, function(err, order1) {
          if(err){
              console.log(err);
          }
        req.session.orderidgenerated = true;
        req.session.razorOrderId = order1.id;
        console.log(courselist);

        res.render(`${config.themeViews}payment`,{
            title: "Payments",
            session: req.session,
            order: order,
            course: courselist,
            keyId: "rzp_test_53E7dptbzQXAlj",
            razoramount: amount,
            razorpayid: order1.id,
            config: req.app.config,
            message: common.clearSessionValue(req.session,'message'),
            messageType: common.clearSessionValue(req.session,'messagType'),
            helpers: req.handlebars.helpers
        });
  
      });
});
router.post('/checkout/confirm/razorpay',async (req,res)=>{
    const config = req.app.config;
    const db = req.app.db;
    var bodymessage = req.body.razorpay_order_id + `|` + req.body.razorpay_payment_id;
    console.log(req.body);
    var secret = "gBk4CcD6kDZnoyZ9GssbCRec"; // from the dashboard
    var generated_signature = crypto.createHmac("sha256",secret).update(bodymessage.toString()).digest('hex');
    console.log(generated_signature);
    console.log(req.body.razorpay_signature);
  if (req.body.razorpay_signature && generated_signature == req.body.razorpay_signature) {
      await db.customers.findOneAndUpdate({_id: getId(req.session.customerId)},{$set: {Paid: "Paid",razorpay_payment_id:req.body.razorpay_payment_id,razorpay_order_id:req.body.razorpay_order_id,razorpay_signature:req.body.razorpay_signature}});
        res.redirect('/customer/registered');
        return;
    }
    else {
        req.session.message = "Signature Matching Failed";
        req.session.messageType = "danger";
        res.redirect('/customer/registered');
        return;
    }
});
router.get('/admin/gallery', restrict,async (req,res)=>
{
    const db = req.app.db;
    var item = await db.gallerys.find({}).toArray();
    res.render('gallery', {
        title: 'Edit product',
        admin: true,
        session: req.session,
        gallery: item,
        message: common.clearSessionValue(req.session, 'message'),
        messageType: common.clearSessionValue(req.session, 'messageType'),
        config: req.app.config,
        editor: true,
        helpers: req.handlebars.helpers
    });
})
router.post('/customer/gallery', restrict,upload2.array('uploadFile'),async (req,res)=>
{
    const config = req.app.config;
    const db = req.app.db;
    
    var files = req.files;
    if(files.length < 1) {
        req.session.message = "All Files Required";
        req.session.messageType = 'danger';
        res.redirect('/customer/register');
        return;
    } 
            try{
                    cloudinary.uploader.upload(files[0].path,
                        async function(error, result) {
                            if(result){
                                console.log(result);
                                var json_String = JSON.stringify(result);
                                var obj = JSON.parse(json_String);
                                
                                console.log(files[0])
                                var uploadobj = {
                                    id: obj.public_id,
                                    path : obj.secure_url,
                                    type: obj.format,
                                    isVideo:false
                                };
                                await db.gallerys.insertOne(uploadobj);
                                fs.unlinkSync(files[0].path);
                            }
                            else {
                                fs.unlinkSync(files[0].path);
                            }
                        });
                    res.redirect('/admin/gallery');
            }catch(ex){
                console.error(colors.red('Failed to insert customer: ', ex));
                res.status(400).json({
                    message: 'Error uploading .'
                });
            }
});
router.post('/customer/deletegallery', restrict,async function(req,res) {
    const db = req.app.db;
    if(!req.body.id) {
        req.session.message = "Id not available";
        req.session.messageType = 'danger';
        res.redirect('/admin/gallery');
        return;
    }
    try{
        await db.gallerys.deleteOne({_id: getId(req.body.id)});
        req.session.message = "Gallery Item successfully Deleted";
        req.session.messageType = 'success';
        res.redirect('/admin/gallery');
        return;
    }
    catch(ex){
        req.session.message = "Gallery Item deletion failed";
        req.session.messageType = 'danger';
        res.redirect('/admin/gallery');
        return;
    }
});
router.post("/customer/youtube", restrict,async function(req,res)
{
    const config = req.app.config;
    const db = req.app.db;
     try{
                var uploadobj = {
                    path : req.body.link,
                    isVideo:true
                };
                await db.gallerys.insertOne(uploadobj);
                res.redirect('/admin/gallery');
        }
        catch(ex)
        {
            console.log(ex);
        }
res.redirect('/admin/gallery');
})

router.post('/customer/confirm', async (req, res)=> {
	console.log('New verify request...');
    const config = req.app.config;

	const id = req.body.requestId;
	const token = req.body.pin;

	authy.verify(id, token, async (verifyErr, verifyRes)=> {
		console.log('In Verification...');
		if (verifyErr) {
			console.log(verifyErr);
            res.send('OTP verification failed.');
            res.redirect('/checkout/information');
            return;
		} else if (verifyRes) {
            console.log("Is session working properly"+req.session.customerEmail);
            const db = req.app.db;
    
            const customerObj = {
                email: req.session.customerEmail,
                firstName: req.session.customerFirstname,
                lastName: req.session.customerLastname,
                address1: req.session.customerAddress1,
                state: req.session.customerState,
                postcode: req.session.customerPostcode,
                phone: req.session.customerPhone,
                password: bcrypt.hashSync(req.body.shipPassword, 10),
                created: new Date()
            };
        
            const schemaResult = validateJson('newCustomer', customerObj);
            if(!schemaResult.result){
                console.log("validation occur due to deleted some items here");
                res.status(400).json(schemaResult.errors);
                return;
            }
        
            // check for existing customer
            const customer =  await db.customers.findOne({ email: req.session.customerEmail });
            if(customer){
                res.status(400).json({
                    message: 'A customer already exists with that email'
                });
                return;
            } 
            // email is ok to be used.
            try{
                const newCustomer = await db.customers.insertOne(customerObj);
                indexCustomers(req.app)
                .then(async () => {
                    // Return the new customer
                    const customerReturn = newCustomer.ops[0];
                    delete customerReturn.password;
        
                    // Set the customer into the session
                    req.session.customerPresent = true;
                    req.session.customerId = customerReturn._id;
                    req.session.customerEmail = customerReturn.email;
                    req.session.customerFirstname = customerReturn.firstName;
                    req.session.customerLastname = customerReturn.lastName;
                    req.session.customerAddress1 = customerReturn.address1;
                    req.session.customerState = customerReturn.state;
                    req.session.customerPostcode = customerReturn.postcode;
                    req.session.customerPhone = customerReturn.phone;
                //    req.session.orderComment = req.body.orderComment;
    
                    // Return customer oject

                    const db = req.app.db;

                    const customer = await db.customers.findOne({ email: mongoSanitize(req.session.customerEmail ) });
                    // check if customer exists with that email
                    if(customer === undefined || customer === null){
                        res.status(400).json({
                            message: 'A customer with that email does not exist.'
                        });
                        return;
                    }
                    // we have a customer under that email so we compare the password
                    bcrypt.compare(req.body.shipPassword, customer.password)
                    .then((result) => {
                        if(!result){
                            // password is not correct
                            res.status(400).json({
                                message: 'Access denied. Check password and try again.'
                            });
                            return;
                        }
                      /*  res.render(`${config.themeViews}checkout-information`, {
                            message: 'Account verified! 🎉',
                            title: 'Success',
                            config: req.app.config,
                            helpers: req.handlebars.helpers,
                            showFooter: true
                          });  */
                        //  res.send('Verified Account');
                          res.redirect('/checkout/information');
                          return;
                    })
                    .catch((err) => {
                        res.status(400).json({
                            message: 'Access denied. Check password and try again.'
                        });
                    });
                });
            }catch(ex){
                console.error(colors.red('Failed to insert customer: ', ex));
                res.status(400).json({
                    message: 'Customer creation failed.'
                });
            }
            } else {
              res.status(401).send(result.error_text);
              res.redirect('/checkout/information');
              return;
            }
	});
});


//*************************************//

// insert a customer
router.post('/customer/create', async (req, res) => {
    const db = req.app.db;

    const customerObj = {
        email: req.body.email,
        company: req.body.company,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        address1: req.body.address1,
        address2: req.body.address2,
        country: req.body.country,
        state: req.body.state,
        postcode: req.body.postcode,
        phone: req.body.phone,
        password: bcrypt.hashSync(req.body.password, 10),
        created: new Date()
    };

    const schemaResult = validateJson('newCustomer', customerObj);
    if(!schemaResult.result){
        res.status(400).json(schemaResult.errors);
        return;
    }

    // check for existing customer
    const customer = await db.customers.findOne({ email: req.body.email });
    if(customer){
        res.status(400).json({
            message: 'A customer already exists with that email address'
        });
        return;
    }
    // email is ok to be used.
    try{
        const newCustomer = await db.customers.insertOne(customerObj);
        indexCustomers(req.app)
        .then(() => {
            // Return the new customer
            const customerReturn = newCustomer.ops[0];
            delete customerReturn.password;

            // Set the customer into the session
            req.session.customerPresent = true;
            req.session.customerId = customerReturn._id;
            req.session.customerEmail = customerReturn.email;
            req.session.customerCompany = customerReturn.company;
            req.session.customerFirstname = customerReturn.firstName;
            req.session.customerLastname = customerReturn.lastName;
            req.session.customerAddress1 = customerReturn.address1;
            req.session.customerAddress2 = customerReturn.address2;
            req.session.customerCountry = customerReturn.country;
            req.session.customerState = customerReturn.state;
            req.session.customerPostcode = customerReturn.postcode;
            req.session.customerPhone = customerReturn.phone;
            req.session.orderComment = req.body.orderComment;

            // Return customer oject
            res.status(200).json(customerReturn);
        });
    }catch(ex){
        console.error(colors.red('Failed to insert customer: ', ex));
        res.status(400).json({
            message: 'Customer creation failed.'
        });
    }
});

router.post('/customer/save', async (req, res) => {
    const customerObj = {
        email: req.body.email,
        company: req.body.company,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        address1: req.body.address1,
        address2: req.body.address2,
        country: req.body.country,
        state: req.body.state,
        postcode: req.body.postcode,
        phone: req.body.phone
    };

    const schemaResult = validateJson('saveCustomer', customerObj);
    if(!schemaResult.result){
        res.status(400).json(schemaResult.errors);
        return;
    }

    // Set the customer into the session
    req.session.customerPresent = true;
    req.session.customerEmail = customerObj.email;
    req.session.customerCompany = customerObj.company;
    req.session.customerFirstname = customerObj.firstName;
    req.session.customerLastname = customerObj.lastName;
    req.session.customerAddress1 = customerObj.address1;
    req.session.customerAddress2 = customerObj.address2;
    req.session.customerCountry = customerObj.country;
    req.session.customerState = customerObj.state;
    req.session.customerPostcode = customerObj.postcode;
    req.session.customerPhone = customerObj.phone;
    req.session.orderComment = req.body.orderComment;

    res.status(200).json(customerObj);
});

// Get customer orders
router.get('/customer/account', async (req, res) => {
    const db = req.app.db;
    const config = req.app.config;

    if(!req.session.customerPresent){
        res.redirect('/customer/login');
        return;
    }

    const orders = await db.orders.find({
        orderCustomer: getId(req.session.customerId)
    })
    .sort({ orderDate: -1 })
    .toArray();
    res.render(`${config.themeViews}customer-account`, {
        title: 'Orders',
        session: req.session,
        orders,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        countryList: getCountryList(),
        config: req.app.config,
        helpers: req.handlebars.helpers
    });
});

// Update a customer
router.post('/customer/update', async (req, res) => {
    const db = req.app.db;

    if(!req.session.customerPresent){
        res.redirect('/customer/login');
        return;
    }

    const customerObj = {
        company: req.body.company,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        address1: req.body.address1,
        address2: req.body.address2,
        country: req.body.country,
        state: req.body.state,
        postcode: req.body.postcode,
        phone: req.body.phone
    };

    const schemaResult = validateJson('editCustomer', customerObj);
    if(!schemaResult.result){
        console.log('errors', schemaResult.errors);
        res.status(400).json(schemaResult.errors);
        return;
    }

    // check for existing customer
    const customer = await db.customers.findOne({ _id: getId(req.session.customerId) });
    if(!customer){
        res.status(400).json({
            message: 'Customer not found'
        });
        return;
    }
    // Update customer
    try{
        const updatedCustomer = await db.customers.findOneAndUpdate(
            { _id: getId(req.session.customerId) },
            {
                $set: customerObj
            }, { multi: false, returnOriginal: false }
        );
        indexCustomers(req.app)
        .then(() => {
            // Set the customer into the session
            req.session.customerEmail = customerObj.email;
            req.session.customerCompany = customerObj.company;
            req.session.customerFirstname = customerObj.firstName;
            req.session.customerLastname = customerObj.lastName;
            req.session.customerAddress1 = customerObj.address1;
            req.session.customerAddress2 = customerObj.address2;
            req.session.customerCountry = customerObj.country;
            req.session.customerState = customerObj.state;
            req.session.customerPostcode = customerObj.postcode;
            req.session.customerPhone = customerObj.phone;
            req.session.orderComment = req.body.orderComment;

            res.status(200).json({ message: 'Customer updated', customer: updatedCustomer.value });
        });
    }catch(ex){
        console.error(colors.red('Failed updating customer: ' + ex));
        res.status(400).json({ message: 'Failed to update customer' });
    }
});

// Update a customer
router.post('/admin/customer/update', restrict, async (req, res) => {
    const db = req.app.db;

    const customerObj = {
        firstName: req.body.firstName,
        fatherName: req.body.fatherName,
        motherName: req.body.motherName,
        Addhar: req.body.addhar,
        Address: req.body.address,
        phone: req.body.phone,
        dob: req.body.dob,
        isSelected: common.convertBool(req.body.isSelected)
    };

    // Handle optional values
    if(req.body.password){ customerObj.password = bcrypt.hashSync(req.body.password, 10); }

   /* const schemaResult = validateJson('editCustomer', customerObj);
    if(!schemaResult.result){
        console.log('errors', schemaResult.errors);
        res.status(400).json(schemaResult.errors);
        return;
    } */

    // check for existing customer
    const customer = await db.customers.findOne({ _id: getId(req.body.customerId) });
    if(!customer){
        res.status(400).json({
            message: 'Customer not found'
        });
        return;
    }
    // Update customer
    try{
        const updatedCustomer = await db.customers.findOneAndUpdate(
            { _id: getId(req.body.customerId) },
            {
                $set: customerObj
            }, { multi: false, returnOriginal: false }
        );
        indexCustomers(req.app)
        .then(() => {
            const returnCustomer = updatedCustomer.value;
            delete returnCustomer.password;
            res.status(200).json({ message: 'Customer updated', customer: updatedCustomer.value });
        });
    }catch(ex){
        console.error(colors.red('Failed updating customer: ' + ex));
        res.status(400).json({ message: 'Failed to update customer' });
    }
});

// Delete a customer
router.delete('/admin/customer', restrict, async (req, res) => {
    const db = req.app.db;

    // check for existing customer
    const customer = await db.customers.findOne({ _id: getId(req.body.customerId) });
    if(!customer){
        res.status(400).json({
            message: 'Failed to delete customer. Customer not found'
        });
        return;
    }
    // Update customer
    try{
        await db.customers.deleteOne({ _id: getId(req.body.customerId) });
        indexCustomers(req.app)
        .then(() => {
            res.status(200).json({ message: 'Customer deleted' });
        });
    }catch(ex){
        console.error(colors.red('Failed deleting customer: ' + ex));
        res.status(400).json({ message: 'Failed to delete customer' });
    }
});

// render the customer view
router.get('/admin/customer/view/:id?', restrict, async (req, res) => {
    const db = req.app.db;

    const customer = await db.customers.findOne({ _id: getId(req.params.id) });

    if(!customer){
         // If API request, return json
        if(req.apiAuthenticated){
            return res.status(400).json({ message: 'Customer not found' });
        }
        req.session.message = 'Customer not found';
        req.session.message_type = 'danger';
        return res.redirect('/admin/customers');
    }

    // If API request, return json
    if(req.apiAuthenticated){
        return res.status(200).json(customer);
    }

    return res.render('customer', {
        title: 'View customer',
        result: customer,
        admin: true,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        countryList: getCountryList(),
        config: req.app.config,
        editor: true,
        helpers: req.handlebars.helpers
    });
});

// customers list
router.get('/admin/customers', restrict, async (req, res) => {
    const db = req.app.db;

    const customers = await db.customers.find({}).limit(20).sort({ created: -1 }).toArray();

    // If API request, return json
    if(req.apiAuthenticated){
        return res.status(200).json(customers);
    }

    return res.render('customers', {
        title: 'Customers - List',
        admin: true,
        customers: customers,
        session: req.session,
        helpers: req.handlebars.helpers,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        config: req.app.config
    });
});

// Filtered customers list
router.get('/admin/customers/filter/:search', restrict, async (req, res, next) => {
    const db = req.app.db;
    const searchTerm = req.params.search;
    const customersIndex = req.app.customersIndex;

    const lunrIdArray = [];
    customersIndex.search(searchTerm).forEach((id) => {
        lunrIdArray.push(getId(id.ref));
    });

    // we search on the lunr indexes
    const customers = await db.customers.find({ _id: { $in: lunrIdArray } }).sort({ created: -1 }).toArray();

    // If API request, return json
    if(req.apiAuthenticated){
        return res.status(200).json({
            customers
        });
    }

    return res.render('customers', {
        title: 'Customer results',
        customers: customers,
        admin: true,
        config: req.app.config,
        session: req.session,
        searchTerm: searchTerm,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers
    });
});

router.post('/admin/customer/lookup', restrict, async (req, res, next) => {
    const db = req.app.db;
    const customerEmail = req.body.customerEmail;

    // Search for a customer
    const customer = await db.customers.findOne({ email: customerEmail });

    if(customer){
        req.session.customerPresent = true;
        req.session.customerId = customer._id;
        req.session.customerEmail = customer.email;
        req.session.customerCompany = customer.company;
        req.session.customerFirstname = customer.firstName;
        req.session.customerLastname = customer.lastName;
        req.session.customerAddress1 = customer.address1;
        req.session.customerAddress2 = customer.address2;
        req.session.customerCountry = customer.country;
        req.session.customerState = customer.state;
        req.session.customerPostcode = customer.postcode;
        req.session.customerPhone = customer.phone;

        return res.status(200).json({
            message: 'Customer found',
            customer
        });
    }
    return res.status(400).json({
        message: 'No customers found'
    });
});

router.get('/customer/login', async (req, res, next) => {
    const config = req.app.config;

    res.render(`${config.themeViews}customer-login`, {
        title: 'Customer login',
        config: req.app.config,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers
    });
});

// Extra Pages
router.get('/customer/contact', async (req, res, next) => {
    const config = req.app.config;

    res.render(`${config.themeViews}customer-contact`, {
        title: 'Contact',
        config: req.app.config,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});
router.get('/customer/portfolio', async (req, res, next) => {
    const config = req.app.config;
    const db = req.app.db;
    var gallery = await db.gallerys.find({}).toArray();
    res.render(`${config.themeViews}portfolio`, {
        title: 'Contact',
        config: req.app.config,
        session: req.session,
        gallery: gallery,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});
router.get('/customer/registered',async (req, res)=>{
    const config = req.app.config;
    const db = req.app.db;

    var customer = await db.customers.find({}).toArray();
    res.render(`${config.themeViews}registered`, {
        title: 'Registered',
        config: req.app.config,
        customers: customer,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});
router.get('/customer/selectedregistered',async (req, res)=>{
    const config = req.app.config;
    const db = req.app.db;

    var customer = await db.customers.find({isSelected: true}).toArray();
    res.render(`${config.themeViews}selectedstudent`, {
        title: 'Selected Student',
        config: req.app.config,
        customers: customer,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});
router.get('/customer/aboutus', async (req, res, next) => {
    const config = req.app.config;

    res.render(`${config.themeViews}aboutus`, {
        title: 'About Us',
        config: req.app.config,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});
router.get('/customer/teams', async (req, res, next) => {
    const config = req.app.config;

    res.render(`${config.themeViews}teams`, {
        title: 'Teams',
        config: req.app.config,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});
router.get('/customer/services', async (req, res, next) => {
    const config = req.app.config;

    res.render(`${config.themeViews}services`, {
        title: 'Teams',
        config: req.app.config,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});
router.get('/customer/forgot-password', async (req, res, next) => {
    const config = req.app.config;

    res.render(`${config.themeViews}customer-forgot-password`, {
        title: 'Forgot Password',
        config: req.app.config,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: true
    });
});

router.get('/customer/privacy', (req, res) => {
    const config = req.app.config;

    res.render(`${config.themeViews}privacy`, {
      title: 'Privacy Policy',
      page: req.query.path,
      config,
      session: req.session,
      message: clearSessionValue(req.session, 'message'),
      messageType: clearSessionValue(req.session, 'messageType'),
      helpers: req.handlebars.helpers,
      showFooter: 'showFooter'
    });
});

router.get('/customer/delivery', (req, res) => {
    const config = req.app.config;

    res.render(`${config.themeViews}delivery`, {
      title: 'Delivery Information',
      page: req.query.path,
      config,
      session: req.session,
      message: clearSessionValue(req.session, 'message'),
      messageType: clearSessionValue(req.session, 'messageType'),
      helpers: req.handlebars.helpers,
      showFooter: 'showFooter'
    });
});

router.get('/customer/terms', (req, res) => {
    const config = req.app.config;

    res.render(`${config.themeViews}terms`, {
      title: 'Terms & Conditions',
      page: req.query.path,
      config,
      session: req.session,
      message: clearSessionValue(req.session, 'message'),
      messageType: clearSessionValue(req.session, 'messageType'),
      helpers: req.handlebars.helpers,
      showFooter: 'showFooter'
    });
});

// login the customer and check the password
router.post('/customer/login_action', async (req, res) => {
    const db = req.app.db;

    const customer = await db.customers.findOne({ email: mongoSanitize(req.body.loginEmail) });
    // check if customer exists with that email
    if(customer === undefined || customer === null){
        res.status(400).json({
            message: 'A customer with that email does not exist.'
        });
        return;
    }
    // we have a customer under that email so we compare the password
    bcrypt.compare(req.body.loginPassword, customer.password)
    .then((result) => {
        if(!result){
            // password is not correct
            res.status(400).json({
                message: 'Access denied. Check password and try again.'
            });
            return;
        }

        // Customer login successful
        req.session.customerPresent = true;
        req.session.customerId = customer._id;
        req.session.customerEmail = customer.email;
        req.session.customerCompany = customer.company;
        req.session.customerFirstname = customer.firstName;
        req.session.customerLastname = customer.lastName;
        req.session.customerAddress1 = customer.address1;
        req.session.customerAddress2 = customer.address2;
        req.session.customerCountry = customer.country;
        req.session.customerState = customer.state;
        req.session.customerPostcode = customer.postcode;
        req.session.customerPhone = customer.phone;

        res.status(200).json({
            message: 'Successfully logged in',
            customer: customer
        });
    })
    .catch((err) => {
        res.status(400).json({
            message: 'Access denied. Check password and try again.'
        });
    });
});

// customer forgotten password
router.get('/customer/forgotten', (req, res) => {
    res.render('forgotten', {
        title: 'Forgotten',
        route: 'customer',
        forgotType: 'customer',
        config: req.app.config,
        helpers: req.handlebars.helpers,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        showFooter: 'showFooter'
    });
});

// forgotten password
router.post('/customer/forgotten_action', apiLimiter, async (req, res) => {
    const db = req.app.db;
    const config = req.app.config;
    const passwordToken = randtoken.generate(30);

    // find the user
    const customer = await db.customers.findOne({ email: req.body.email });
    try{
        if(!customer){
            // if don't have an email on file, silently fail
            res.status(200).json({
                message: 'If your account exists, a password reset has been sent to your email'
            });
            return;
        }
        const tokenExpiry = Date.now() + 3600000;
        await db.customers.updateOne({ email: req.body.email }, { $set: { resetToken: passwordToken, resetTokenExpiry: tokenExpiry } }, { multi: false });
        // send forgotten password email
        const mailOpts = {
            to: req.body.email,
            subject: 'Forgotten password request',
            body: `You are receiving this because you (or someone else) have requested the reset of the password for your user account.\n\n
                Please click on the following link, or paste this into your browser to complete the process:\n\n
                ${config.baseUrl}/customer/reset/${passwordToken}\n\n
                If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        // send the email with token to the user
        // TODO: Should fix this to properly handle result
        sendEmail(mailOpts.to, mailOpts.subject, mailOpts.body);
        res.status(200).json({
            message: 'If your account exists, a password reset has been sent to your email'
        });
    }catch(ex){
        res.status(400).json({
            message: 'Password reset failed.'
        });
    }
});

// reset password form
router.get('/customer/reset/:token', async (req, res) => {
    const db = req.app.db;

    // Find the customer using the token
    const customer = await db.customers.findOne({ resetToken: req.params.token, resetTokenExpiry: { $gt: Date.now() } });
    if(!customer){
        req.session.message = 'Password reset token is invalid or has expired';
        req.session.message_type = 'danger';
        res.redirect('/forgot');
        return;
    }

    // show the password reset form
    res.render('reset', {
        title: 'Reset password',
        token: req.params.token,
        route: 'customer',
        config: req.app.config,
        message: clearSessionValue(req.session, 'message'),
        message_type: clearSessionValue(req.session, 'message_type'),
        show_footer: 'show_footer',
        helpers: req.handlebars.helpers
    });
});

// reset password action
router.post('/customer/reset/:token', async (req, res) => {
    const db = req.app.db;

    // get the customer
    const customer = await db.customers.findOne({ resetToken: req.params.token, resetTokenExpiry: { $gt: Date.now() } });
    if(!customer){
        req.session.message = 'Password reset token is invalid or has expired';
        req.session.message_type = 'danger';
        return res.redirect('/forgot');
    }

    // update the password and remove the token
    const newPassword = bcrypt.hashSync(req.body.password, 10);
    try{
        await db.customers.updateOne({ email: customer.email }, { $set: { password: newPassword, resetToken: undefined, resetTokenExpiry: undefined } }, { multi: false });
        const mailOpts = {
            to: customer.email,
            subject: 'Password successfully reset',
            body: 'This is a confirmation that the password for your account ' + customer.email + ' has just been changed successfully.\n'
        };

        // TODO: Should fix this to properly handle result
        sendEmail(mailOpts.to, mailOpts.subject, mailOpts.body);
        req.session.message = 'Password successfully updated';
        req.session.message_type = 'success';
        return res.redirect('/checkout/payment');
    }catch(ex){
        console.log('Unable to reset password', ex);
        req.session.message = 'Unable to reset password';
        req.session.message_type = 'danger';
        return res.redirect('/forgot');
    }
});

// logout the customer
router.post('/customer/logout', (req, res) => {
    // Clear our session
    clearCustomer(req);
    res.status(200).json({});
});

// logout the customer
router.get('/customer/logout', (req, res) => {
    // Clear our session
    clearCustomer(req);
    res.redirect('/customer/login');
});

module.exports = router;
