const http = require("http");
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

// Port number that server listens to
const PORT = 9029;

const getGamesData = async (client) => {
    //Fetches records from given database
    const cursor = await client.db("PlayStationDB").collection("PlayStation").find({});
    const results = await cursor.toArray();
    return results;
}

const errorPage = (res) => {
    fs.readFile(path.join(__dirname, "public", "error.html"), (error, data) => {
        if (error) throw error;
        res.writeHead(200, "Success", { "content-type": "text/html" });
        res.write(data, "utf-8");
        res.end();
    });
}

//Creates HTTP Server(i.e our system acts as server)
const server = http.createServer(async (req, res) => {
    console.info(req.url);
    if (req.url === "/api") {
        const URL = "mongodb+srv://vishrudhbalaji:vishrudhbalaji@cluster0.oyxui.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
        // Creating a new client for connecting to database
        const client = new MongoClient(URL);
        try {
            //Connects to database
            await client.connect();
            console.log("Database is connected sucessfully");
            const gamesData = await getGamesData(client);
            console.log(JSON.stringify(gamesData));
            //Handling CORS Issue
            res.setHeader("Access-Control-Allow-Origin", '*');
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify(gamesData));
            }
            catch (e) {
                console.error("Error connecting in database : ", e);
            }
            finally {
                //Closing connection to database
                await client.close();
                console.log("Database connection closed")
            }
    }
    else {
        let contentType;
        let filePath = path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);
        let fileExtension = path.extname(filePath);
        switch (fileExtension) {
            case ".html":
                contentType = "text/html";
                break;
            case ".css":
                contentType = "text/css";
                break;
            case ".js":
                contentType = "application/javascript";
                break;
            case ".json":
                contentType= "application/json";
                break;
            case ".svg":
                contentType = "image/svg+xml";
                break;
            default:
                contentType = "text/plain";
                break;
        }
        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.code === "ENOENT") {
                    errorPage(res);
                }
                else {
                    res.writeHead(500, { "content-type": "text/plain" });
                    res.end("Internal Server Error");
                }
            }
            else {
                //Assigning content-type based on file extension
                res.writeHead(200, { "content-type": contentType });
                res.end(data);
            }
        })
    }
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

