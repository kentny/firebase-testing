import fs from 'fs';
import * as testing from '@firebase/rules-unit-testing';

const projectId = 'test-project';
const testTweetId = 'Test-User';

describe('Testing tweets (tweets/**) security rule', () => {
    let testEnv: testing.RulesTestEnvironment;
    let authenticatedUser:  testing.RulesTestContext;
    let unauthenticatedUser:  testing.RulesTestContext;

    beforeAll(async () => {
        testEnv = await testing.initializeTestEnvironment({
            projectId: projectId,
            firestore: {
                rules: fs.readFileSync("firestore.rules", "utf8"),
                host: 'localhost',
                port: 8080,
            }
        });
    });

    beforeEach(async () => {
        // Add initial data.
        await testEnv.withSecurityRulesDisabled(context => {
            const firestoreWithoutRule = context.firestore()
            return firestoreWithoutRule
                .collection('tweets')
                .doc(testTweetId)
                .set({
                    text: 'initial tweet',
                    userId: 'test-user',
                    createdAt: new Date(2022, 10, 11, 15, 30, 0),
                });
        })
        authenticatedUser = testEnv.authenticatedContext(testTweetId);
        unauthenticatedUser = testEnv.unauthenticatedContext();
    });

    it('Unauthenticated user can READ.', async () => {
        const readUser = unauthenticatedUser.firestore()
            .collection('tweets')
            .doc(testTweetId)
            .get()

        await testing.assertSucceeds(readUser);
    });

    it('Nobody can CREATE.', async () => {
        const createByAuthenticatedUser = authenticatedUser.firestore()
            .collection('tweets')
            .add({
                text: "new tweet",
                userId: 'test-user',
                createdAt: new Date(),
            });

        await testing.assertFails(createByAuthenticatedUser);


        const createByUnauthenticatedUser = unauthenticatedUser.firestore()
            .collection('tweets')
            .add({
                text: "new tweet",
                userId: 'test-user',
                createdAt: new Date(),
            });

        await testing.assertFails(createByUnauthenticatedUser);
    });

    it('Nobady can UPDATE.', async () => {
        const updateByAuthenticatedUser = authenticatedUser.firestore()
            .collection('tweets')
            .doc(testTweetId)
            .update({
                text: "updated tweet",
            });

        await testing.assertFails(updateByAuthenticatedUser);


        const updateByUnauthenticatedUser = unauthenticatedUser.firestore()
            .collection('tweets')
            .doc(testTweetId)
            .update({
                text: "updated tweet",
            });

        await testing.assertFails(updateByUnauthenticatedUser);
    });

    it('Nobody can DELETE.', async () => {
        const deleteByAuthenticatedUser = authenticatedUser.firestore()
            .collection('tweets')
            .doc(testTweetId)
            .delete()

        await testing.assertFails(deleteByAuthenticatedUser);


        const deleteByUnauthenticatedUser = unauthenticatedUser.firestore()
            .collection('tweets')
            .doc(testTweetId)
            .delete()

        await testing.assertFails(deleteByUnauthenticatedUser);
    });

});
