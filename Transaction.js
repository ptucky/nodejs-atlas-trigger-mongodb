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

        // Create Reservation
        // console.log(await createReservationDocument("Infinite Views", [new Date("2021-12-31"), new Date("2021-12-31")], { pricePerNight: 180, specialRequests: "Late checkout", breakfastIncluded: true }));

        await createReservation(client,
            "leslie@example.com",
            "Infinite Views",
            [new Date("2019-12-31"), new Date("2020-01-01")],
            { pricePerNight: 180, specialRequests: "Late checkout", breakfastIncluded: true });


    } catch (e) {
        console.error(e);
    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);

// Atomicity, Consistency, Isolation, Durability

/**
 * A helper function that generates a reservation document
 * @param {String} nameOfListing The name of the Airbnb listing to be reserved
 * @param {Array.Date} reservationDates An array of the date(s) for the reservation
 * @param {Object} reservationDetails An object containing additional reservation details that need to be stored with the reservation
 * @returns {Object} The reservation document
 */
 function createReservationDocument(nameOfListing, reservationDates, reservationDetails) {
    // Create the reservation
    let reservation = {
        name: nameOfListing,
        dates: reservationDates,
    }

    // Add additional properties from reservationDetails to the reservation
    for (let detail in reservationDetails) {
        reservation[detail] = reservationDetails[detail];
    }

    return reservation;
}


async function createReservation(client, userEmail, nameOfListing, reservationDates, reservationDetails) {

    /**
     * The users collection in the sample_airbnb database
     */
    const usersCollection = client.db("sample_airbnb").collection("users");

    /**
     * The listingsAndReviews collection in the sample_airbnb database
     */
    const listingsAndReviewsCollection = client.db("sample_airbnb").collection("listingsAndReviews");
    

    /**
     * The reservation document that will be added to the users collection document for this user
     */
    const reservation = createReservationDocument(nameOfListing, reservationDates, reservationDetails);

    // Step 1: Start a Client Session
    // See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html#startSession for the startSession() docs
    const session = client.startSession();

    // Step 2: Optional. Define options for the transaction
    const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' }
    };


    try {
        // Step 3: Use withTransaction to start a transaction, execute the callback, and commit (or abort on error)
        // Note: The callback for withTransaction MUST be async and/or return a Promise.
        // See https://mongodb.github.io/node-mongodb-native/3.6/api/ClientSession.html#withTransaction for the withTransaction() docs        
        const transactionResults = await session.withTransaction(async () => {

            const usersUpdateResults = await usersCollection.updateOne(
                { email: userEmail },
                { $addToSet: { reservations: reservation } },
                { session }
            );
            console.log(`${usersUpdateResults.matchedCount} document(s) found in the users collection with the email address ${userEmail}.`);
            console.log(`${usersUpdateResults.modifiedCount} document(s) was/were updated to include the reservation.`);

            const isListingReservedResults = await listingsAndReviewsCollection.findOne(
                { name: nameOfListing, datesReserved: { $in: reservationDates } },
                { session }
            );
            if (isListingReservedResults) {
                await session.abortTransaction();
                console.error("This listing is already reserved for at least one of the given dates. The reservation could not be created.");
                console.error("Any operations that already occurred as part of this transaction will be rolled back.")
                return;
            }

            const listingsAndReviewsUpdateResults = await listingsAndReviewsCollection.updateOne(
                { name: nameOfListing },
                { $addToSet: { datesReserved: { $each: reservationDates } } },
                { session }
            );
            console.log(`${listingsAndReviewsUpdateResults.matchedCount} document(s) found in the listingsAndReviews collection with the name ${nameOfListing}.`);
            console.log(`${listingsAndReviewsUpdateResults.modifiedCount} document(s) was/were updated to include the reservation dates.`);


        }, transactionOptions);

        if (transactionResults) {
            console.log("The reservation was successfully created.");
        } else {
            console.log("The transaction was intentionally aborted.");
        }
    } catch (e) {
        console.log("The transaction was aborted due to an unexpected error: " + e);
    } finally {
        // Step 4: End the session
        await session.endSession();
    }


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