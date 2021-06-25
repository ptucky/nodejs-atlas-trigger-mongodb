const { MongoClient } = require('mongodb');

async function main() {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */
    const uri = "mongodb+srv://tucky:Jack*339@cluster0.g9o3s.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

    /**
     * The Mongo Client you will use to interact with your database
     * See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html for more details
     * In case: '[MONGODB DRIVER] Warning: Current Server Discovery and Monitoring engine is deprecated...'
     * pass option { useUnifiedTopology: true } to the MongoClient constructor.
     * const client =  new MongoClient(uri, {useUnifiedTopology: true})
     */
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Make the appropriate DB calls
        // await listDatabases(client);
        
        // Delete the "Cozy Cottage" listing
        // await deleteListingByName(client, "Cozy Cottage");

        // Delete the listings that were scraped before February 15, 2019
        await deleteListingsScrapedBeforeDate(client, new Date("2019-02-15"));



    } catch (e) {
        console.error(e);
    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);


async function deleteListingByName(client, nameOfListing) {
    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#deleteOne for the deleteOne() docs
    const result = await client.db("sample_airbnb").collection("listingsAndReviews")
                .deleteOne({ name: nameOfListing });

    console.log(`${result.deletedCount} document(s) was/were deleted.`);
}


async function deleteListingsScrapedBeforeDate(client, date) {
    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#deleteMany for the deleteMany() docs
    const result = await client.db("sample_airbnb").collection("listingsAndReviews").deleteMany({ "last_scraped": { $lt: date } });
    console.log(`${result.deletedCount} document(s) was/were deleted.`);
}




/**
 * Print the names of all available databases
 * @param {MongoClient} client A MongoClient that is connected to a cluster
 */
async function listDatabases(client) {
    databasesList = await client.db().admin().listDatabases();

    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};