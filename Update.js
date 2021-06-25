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
        
        // Update the Infinite Views listing to have 6 bedrooms and 8 beds 
        //await updateListingByName(client, "Infinite Views", { bedrooms: 6, beds: 8 });

        // Upsert the Cozy Cottage listing
        // await upsertListingByName(client, "Cozy Cottage", { name: "Cozy Cottage", bedrooms: 2, bathrooms: 1 });


        // UPDATE MANY
        // Update all listings so they have a property type
        await updateAllListingsToHavePropertyType(client);



    } catch (e) {
        console.error(e);
    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);


// $inc, $set, $unset


/** Update One
 * $inc, $set, $unset
 */
async function updateListingByName(client, nameOfListing, updatedListing) {
    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#updateOne for the updateOne() docs
    const result = await client.db("sample_airbnb").collection("listingsAndReviews")
                    .updateOne({ name: nameOfListing }, { $set: updatedListing });

    console.log(`${result.matchedCount} document(s) matched the query criteria.`);
    console.log(`${result.modifiedCount} document(s) was/were updated.`);
}

/** UPSERT 
 * upsert
*/
async function upsertListingByName(client, nameOfListing, updatedListing) {
    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#updateOne for the updateOne() docs
    const result = await client.db("sample_airbnb").collection("listingsAndReviews")
                    .updateOne({ name: nameOfListing }, { $set: updatedListing }, { upsert: true });
    
        console.log(`${result.matchedCount} document(s) matched the query criteria.`);

    if (result.upsertedCount > 0) {
        console.log(`One document was inserted with the id ${result.upsertedId._id}`);
    } else {
        console.log(`${result.modifiedCount} document(s) was/were updated.`);
    }
}


/** 
 * Update 
 * updateAllListingsToHavePropertyType
 * */
async function updateAllListingsToHavePropertyType(client) {
    // See https://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html#updateMany for the updateMany() docs
    const result = await client.db("sample_airbnb").collection("listingsAndReviews")
                        .updateMany({ property_type: { $exists: false } }, { $set: { property_type: "Unknown" } });

    console.log(`${result.matchedCount} document(s) matched the query criteria.`);
    console.log(`${result.modifiedCount} document(s) was/were updated.`);
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