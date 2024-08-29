const express= require('express')    //  installing required dependencies
const request=require('request')
const WebSocket = require('ws');
//Syntax of express
const app= express()
//Ignore rn
//Middlewares
/*
    Ask express.js to look for a folder called views
*/
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs") 
const dotenv=require('dotenv')
dotenv.config()
app.use('/public',express.static('public'));
const axios = require('axios');
const crypto=require('crypto-js')
function signRequest(method, requestPath, body,value) { // function to have create signature for authentication in okx testnet platform
    const timestamp = new Date().toISOString();
   // console.log(timestamp)
    let prehash
    body=JSON.stringify(body)
    if(value==0)
    prehash = timestamp + method + requestPath + body
    else
    prehash = timestamp + method + requestPath
    //console.log(prehash)
    const signature = crypto.enc.Base64.stringify(crypto.HmacSHA256(prehash, process.env.SECRET_KEY));
    return { timestamp, signature };
}
const createHeaders = (method, requestPath, body,value) => {  //functions to create request params for okx
    const { timestamp, signature } = signRequest(method, requestPath, body,value);
    //console.log(signature)
    return {
        'Content-Type': 'application/json',
        'OK-ACCESS-TIMESTAMP':timestamp,
        'x-simulated-trading':1,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-KEY':'9a1968c9-8b72-4d43-b35b-0ba1a9a14110',
        'OK-ACCESS-PASSPHRASE': process.env.PASSPHRASE
    };
};
app.get("/", async(req, res)=>{   // home rote or landing page
    const method = 'GET';     // this method is follwed everywhere creating request body for authentication and posting it with axios
     const instType='SPOT'
    const requestPath = `/api/v5/market/tickers?instType=${instType}`;  // api of okx to handle this
    const body =''
    const headers = createHeaders(method, requestPath, body,1);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url, body);
         data1=response.data
         res.render("trading", {crypto: data1})
    } catch (error) {
        res.json(error.errors);
    }
})
app.get("/position", async(req, res)=>{  //route to handle position or holdings
    const method = 'GET';
     let currency='';
     const q=req.query.instId
     for(let i=0;i<q.length;i++)
     {
         if(q[i]!='-')
            currency+=q[i];
        else
         break
     }
    const requestPath = `/api/v5/account/balance?ccy=${currency}`; 
    const body=''
    const headers = createHeaders(method,requestPath,body,1);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url,{headers});
         data1=response.data
         arr=data1.data[0].details
         if(arr.length)
         res.send(data1.data[0].details[0].availBal)
          else
          res.send("0")
    } catch (error) {
        res.json(error);
    }
})
app.post("/placed", async(req, res)=>{ //route to handle placed route (SPOT)
    const method = 'POST';
    console.log(req.body)
    const body = {
        instId: req.body.instId[1],
        tdMode: 'cash',   // Specifies cash mode
        side: 'buy',
        ordType: 'market',
        sz: req.body.sz      // Size of the order
    }
    const body1=body
    const requestPath = '/api/v5/trade/order'
    const headers = createHeaders(method,requestPath,body,0);
    console.log(body1)
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.post(url,body1,{headers});
         data1=response.data
         res.send(data1.data[0].sMsg)
    } catch (error) {
        //console.log(error)
        res.json(error);
    }
})

app.get("/orderplacement", async(req, res)=>{ //route to handle order placement  (SPOT)
    const data1={}
    data1.Crypto=req.query.instId
    res.render("spotorder",{data:data1});
})
app.get("/orderbook", async(req, res)=>{ //route to handle orderbook
    const method = 'GET';
     const sz=200;
    const requestPath = `/api/v5/market/books?instId=${req.query.instId}&sz=${sz}`; 
    const body =''
    const cryptoname={instId:req.query.instId}
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url, body);
         data1=response.data.data[0]
         console.log(data1.bids)
         res.render("orderbook",{crypto:data1,cryptos:cryptoname})
    } catch (error) {
        //console.log(error.errors)
        res.json(error.errors);
    }
})
app.get("/pendingorders", async(req, res)=>{ //route to handle pending orders or order (SPOT)
    const method = 'GET';
    const Inst='SPOT'
    const type='market'
    const requestPath = `/api/v5/trade/orders-history-archive?instId=${req.query.instId}&instType=${Inst}&ordType=${type}`; 
    const body=''
    const headers = createHeaders(method,requestPath,body,1);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url,{headers});
         data1=response.data
         //console.log(data1)
          res.render("pendingorders",{crypto:data1})
    } catch (error) {
       // console.log(error)
        res.json(error);
    }
})
app.post("/sell", async(req, res)=>{ //route to handle sell order(SPOT)
    const method = 'POST';
    const body = {
        instId: req.body.instId[1],
        tdMode: 'cash',   // Specifies cash mode
        side: 'sell',
        ordType: 'market',
        sz: req.body.sz      // Size of the order
    }
    const body1=body
    const requestPath = '/api/v5/trade/order'
    const headers = createHeaders(method,requestPath,body,0);
    console.log(body1)
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.post(url,body1,{headers});
         data1=response.data
         res.send(data1.data[0].sMsg)
    } catch (error) {
        //console.log(error)
        res.json(error);
    }
})
app.get("/sellplacement", async(req, res)=>{ //route to handle sell order (SPOT)
    const data1={}
    data1.Crypto=req.query.instId
    res.render("sellspotorder",{data:data1});
})
app.get("/futures", async(req, res)=>{   //route to land on future option trading web page
    const method = 'GET';
     const instType='FUTURES'
    const requestPath = `/api/v5/market/tickers?instType=${instType}`; 
    const body =''
    const headers = createHeaders(method, requestPath, body,1);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url, body);
         data1=response.data
         res.render("tradingfutures", {crypto: data1})
    } catch (error) {
        //console.log(error.errors)
        res.json(error.errors);
    }
})
app.get("/futureorderplacement", async(req, res)=>{ //route to handle future contracts or order placement
    const data1={}
    data1.Crypto=req.query.instId
    const Inst='FUTURES'
    const method='GET'
    const requestPath = `/api/v5/public/instruments?instType=${Inst}&instId=${req.query.instId}`
    const body=''
    const headers = createHeaders(method,requestPath,body,0);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url, body);
         data1.lotSz=response.data.data[0].lotSz
         res.render("futureorderplacement",{data:data1});
    } catch (error) {
       // console.log(error.errors)
        res.json(error.errors);
    }
})
app.post("/futureoptionplaced", async(req, res)=>{ //route to handle  future option 
    const method = 'POST';
    console.log(req.body)
    const body = {
        instId: req.body.instId[1],
        tdMode: 'cross',   // Specifies cash mode
        side: 'buy',
        ordType: 'limit',
        px:req.body.px,
        sz: req.body.sz,
        posSide:'long'      // position of holding
    }
    const body1=body
    const requestPath = '/api/v5/trade/order'
    const headers = createHeaders(method,requestPath,body,0);
    console.log(body1)
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.post(url,body1,{headers});
         data1=response.data
         console.log(data1);
         res.send(data1.data[0].sMsg)
    } catch (error) {
        //console.log(error)
        res.json(error);
    }
})
app.get("/sellfutureorderplacement", async(req, res)=>{ //route to handle sell future order placement
    const data1={}
    data1.Crypto=req.query.instId
    const Inst='FUTURES'
    const method='GET'
    const requestPath = `/api/v5/public/instruments?instType=${Inst}&instId=${req.query.instId}`
    const body=''
    const headers = createHeaders(method,requestPath,body,0);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url, body);
         data1.lotSz=response.data.data[0].lotSz
         res.render("sellfutureorderplacement",{data:data1});
    } catch (error) {
        //console.log(error.errors)
        res.json(error.errors);
    }
})
app.post("/Sellfutureorderplaced", async(req, res)=>{ //route to handle sell future order placed route
    const method = 'POST';
    console.log(req.body)
    const body = {
        instId: req.body.instId[1],
        tdMode: 'cross',   // Specifies cash mode
        side: 'sell',
        ordType: 'limit',
        px:req.body.px,
        sz: req.body.sz,
        posSide:'short'      // position term
    }
    const body1=body
    const requestPath = '/api/v5/trade/order'
    const headers = createHeaders(method,requestPath,body,0);
    console.log(body1)
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.post(url,body1,{headers});
         data1=response.data
        // console.log(data1);
         res.send(data1.data[0].sMsg)
    } catch (error) {
       // console.log(error)
        res.json(error);
    }
})
app.get("/futuretradingposition", async(req, res)=>{ //route to future trading position
    const method = 'GET'; 
    const Inst='FUTURES'
    const requestPath = `/api/v5/account/positions?instId=${req.query.instId}&instType=${Inst}`; 
    const body=''
    const headers = createHeaders(method,requestPath,body,1);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url,{headers});
         data1=response.data
         //console.log(data1)
         res.render("futuretradingposition",{crypto:data1})
    } catch (error) {
        //console.log(error)
        res.json(error);
    }
})
app.get("/futureoptionorderhistory", async(req, res)=>{ //route to handle future option order history
    const method = 'GET';
    const Inst='FUTURES'
    const type='market'
    const requestPath = `/api/v5/trade/orders-pending?instId=${req.query.instId}&instType=${Inst}`; 
    const body=''
    const headers = createHeaders(method,requestPath,body,1);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url,{headers});
         data1=response.data
        res.render("futureoptionpendingorders",{crypto:data1})
    } catch (error) {
       // console.log(error)
        res.json(error);
    }
})
app.get("/modifyfutureorderplacement", async(req, res)=>{ //route for modification of page
    const data1={}
    data1.Crypto=req.query.instId
    data1.ordId=req.query.ordId
    const Inst='FUTURES'
    const method='GET'
    const requestPath = `/api/v5/public/instruments?instType=${Inst}&instId=${req.query.instId}`
    const body=''
    const headers = createHeaders(method,requestPath,body,0);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url, body);
         data1.lotSz=response.data.data[0].lotSz
         res.render("modifyfutureorderplacement",{data:data1});
    } catch (error) {
       // console.log(error.errors)
        res.json(error.errors);
    }
})
app.post("/modifyfutureorder", async(req, res)=>{ // route to modify future order
    const method = 'POST';
    const body = {
        ordId:req.body.ordId,
        newSz:req.body.newSz,
        instId:req.body.instId[1]
    }
    const body1=body
    const requestPath = '/api/v5/trade/amend-order'
    const headers = createHeaders(method,requestPath,body,0);
    console.log(body1)
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.post(url,body1,{headers});
         data1=response.data
         //console.log(data1);
         res.send("Order-Amended")
    } catch (error) {
        //console.log(error)
        res.json(error);
    }
})
app.get("/Cancelfutureorder", async(req, res)=>{
    const method = 'POST';
    const body = {
        ordId:req.query.ordId,
        instId:req.query.instId
    }
    const body1=body
    const requestPath = '/api/v5/trade/cancel-order'
    const headers = createHeaders(method,requestPath,body,0);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.post(url,body1,{headers});
         data1=response.data
         res.send("Order-Canceled")
    } catch (error) {
       // console.log(error)
        res.json(error);
    }
})
// similarly routes to handle option trading
app.get("/options", async(req, res)=>{
    const method = 'GET';
     const instType='OPTION'
    const requestPath = `/api/v5/market/tickers?instType=${instType}`; 
    const body =''
    const headers = createHeaders(method, requestPath, body,1);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url, body);
       // console.log(response.data)
         data1=response.data
         //console.log(data1.data)
         res.render("tradingoptions", {crypto: data1})
    } catch (error) {
        console.log(error.errors)
        res.json(error.errors);
    }
})
app.get("/optionorderplacement", async(req, res)=>{
    const data1={}
    data1.Crypto=req.query.instId
    const Inst='OPTION'
    let uly=''
    const instId=req.query.instId
    let count=0
    for(let i=0;i<instId.length;i++)
    {
        if(instId[i]=='-')
        {
            if(count==1)
                break;
            else
            {
                uly+=instId[i];
                count++;
            }
        }
        else
        uly+=instId[i];
    }
    const method='GET'
    const requestPath = `/api/v5/public/instruments?instType=${Inst}&instId=${req.query.instId}&uly=${uly}`
    //const rq='/api/v5/account/balance'
    const body=''
    const headers = createHeaders(method,requestPath,body,0);
    //console.log("YES")
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url, body);
        // console.log(response)
         data1.lotSz=response.data.data[0].lotSz
         //console.log(data1.data)
         res.render("optionorderplacement",{data:data1});
    } catch (error) {
       // console.log(error.errors)
        res.json(error.errors);
    }
})
app.post("/optionorderplaced", async(req, res)=>{
    const method = 'POST';
    console.log(req.body.instId[1])
    const body = {
        instId: req.body.instId[1],
        tdMode: 'cross',   // Specifies cash mode
        side: 'buy',
        ordType: 'limit',
        px:req.body.px,
        sz: req.body.sz
    }
    const body1=body
    const requestPath = '/api/v5/trade/order'
    const headers = createHeaders(method,requestPath,body,0);
    console.log(body1)
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.post(url,body1,{headers});
         data1=response.data
         //console.log(data1);
         res.send(data1.data[0].sMsg)
    } catch (error) {
        //console.log(error)
        res.json(error);
    }
})
app.post("/Selloptionorderplaced", async(req, res)=>{
    const method = 'POST';
    console.log(req.body)
    const body = {
        instId: req.body.instId[1],
        tdMode: 'cross',   // Specifies cash mode
        side: 'sell',
        ordType: 'limit',
        px:req.body.px,
        sz: req.body.sz,      // Size of the order
    }
    const body1=body
    const requestPath = '/api/v5/trade/order'
    const headers = createHeaders(method,requestPath,body,0);
    console.log(body1)
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.post(url,body1,{headers});
         data1=response.data
         console.log(data1);
         res.send(data1.data[0].sMsg)
    } catch (error) {
        console.log(error)
        res.json(error);
    }
})
app.get("/selloptionorderplacement", async(req, res)=>{
    const data1={}
    data1.Crypto=req.query.instId
    const Inst='OPTION'
    const instId=req.query.instId
    const method='GET'
    let uly=''
    let count=0
    for(let i=0;i<instId.length;i++)
    {
        if(instId[i]=='-')
        {
            if(count==1)
                break;
            else
            {
                uly+=instId[i];
                count++;
            }
        }
        else
        uly+=instId[i];
    }
    const requestPath = `/api/v5/public/instruments?instType=${Inst}&instId=${req.query.instId}&uly=${uly}`
    const body=''
    const headers = createHeaders(method,requestPath,body,0);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url, body);
         data1.lotSz=response.data.data[0].lotSz
         res.render("selloptionorderplacement",{data:data1});
    } catch (error) {
      //  console.log(error.errors)
        res.json(error.errors);
    }
})
app.get("/modifyoptionorderplacement", async(req, res)=>{
    const data1={}
    data1.Crypto=req.query.instId
    data1.ordId=req.query.ordId
    const Inst='OPTION'
    const method='GET'
    const requestPath = `/api/v5/public/instruments?instType=${Inst}&instId=${req.query.instId}`
    const body=''
    const headers = createHeaders(method,requestPath,body,0);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url, body);
         data1.lotSz=response.data.data[0].lotSz
         res.render("modifyoptionorder",{data:data1});
    } catch (error) {
      //  console.log(error.errors)
        res.json(error.errors);
    }
})
app.post("/modifyoptionorder", async(req, res)=>{
    const method = 'POST';
    const body = {
        ordId:req.body.ordId,
        newSz:req.body.newSz,
        instId:req.body.instId[1]
    }
    const body1=body
    const requestPath = '/api/v5/trade/amend-order'
    const headers = createHeaders(method,requestPath,body,0);
   // console.log(body1)
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.post(url,body1,{headers});
         data1=response.data
       //  console.log(data1);
         res.send("Order-Amended")
    } catch (error) {
       // console.log(error)
        res.json(error);
    }
})
app.get("/Canceloptionorder", async(req, res)=>{
    const method = 'POST';
    const body = {
        ordId:req.query.ordId,
        instId:req.query.instId
    }
    const body1=body
    const requestPath = '/api/v5/trade/cancel-order'
    const headers = createHeaders(method,requestPath,body,0);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.post(url,body1,{headers});
         data1=response.data
         res.send("Order-Canceled")
    } catch (error) {
       // console.log(error)
        res.json(error);
    }
})
app.get("/optionorderhistory", async(req, res)=>{
    const method = 'GET';
    const Inst='OPTION'
    const type='market'
    const requestPath = `/api/v5/trade/orders-pending?instId=${req.query.instId}&instType=${Inst}`; 
    const body=''
    const headers = createHeaders(method,requestPath,body,1);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url,{headers});
         data1=response.data
        res.render("futureoptionpendingorders",{crypto:data1})
    } catch (error) {
       // console.log(error)
        res.json(error);
    }
})
app.get("/optiontradingposition", async(req, res)=>{
    const method = 'GET';
    const Inst='OPTION'
    const requestPath = `/api/v5/account/positions?instId=${req.query.instId}&instType=${Inst}`; 
    const body=''
    const headers = createHeaders(method,requestPath,body,1);
    const url='https://www.okx.com'+requestPath
    try {
        const response = await axios.get(url,{headers});
         data1=response.data
         res.render("futuretradingposition",{crypto:data1})
    } catch (error) {
        res.json(error);
    }
})
app.get("/liveupdates", async(req, res)=>{
   const data1={}
   data1.instId=req.query.instId
   res.render("liveupdates",{data:data1})
})
app.get("*", (req, res)=>{
    res.send("Go back! Illegal response")
})

const server=app.listen(process.env.PORT, ()=>{
    console.log("Server has started")
})

// web socket code

const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    const okxSocket = new WebSocket('wss://wspap.okx.com:8443/ws/v5/public');
    ws.on('message', (cryptoId) => {
    okxSocket.on('open', () => {
    console.log('Connected to OKX WebSocket');
    const buffer = Buffer.from(cryptoId);
    const decodedData = buffer.toString('utf8');
    okxSocket.send(JSON.stringify({
      op: 'subscribe',
      args: [{
        channel: 'books',  // Order book channel
        instId: decodedData //  symbol
      }]
    }));
  });

  // Forward OKX data to the client
  okxSocket.on('message', (data) => {
    const data1=JSON.parse(data)
    //console.log('Received data from OKX:', JSON.parse(data));
    //console.log("YES")
    if(data1.data)
    {
    //console.log(data1.data[0].asks)
    ws.send(JSON.stringify(data1.data[0].asks));
    }  // Send order book updates to the connected client
  });

  // Handle OKX WebSocket errors
  okxSocket.on('error', (error) => {
    console.error('OKX WebSocket error:', error);
  });

    });

    ws.on('close', () => {
        console.log('Client disconnected');
        okxSocket.close();
    });
});