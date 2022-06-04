import fs from 'fs';
import * as testing from '@firebase/rules-unit-testing';

const projectId = 'test-project';
const testUserId = 'Test-User';
const testUserTweetId = 'Test-User-Tweet';

describe('Testing users (users/**) security rule', () => {
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

    describe('Testing users (users/{userId}) security rule', () => {
        beforeEach(async () => {
            // Add initial data.
            await testEnv.withSecurityRulesDisabled(context => {
                const firestoreWithoutRule = context.firestore()
                return firestoreWithoutRule
                    .collection('users')
                    .doc(testUserId)
                    .set({ name: 'initial user name' })
            })
            authenticatedUser = testEnv.authenticatedContext(testUserId);
            unauthenticatedUser = testEnv.unauthenticatedContext();
        })

        it('Unauthenticated user can READ.', async () => {
            const readUser = unauthenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .get()

            await testing.assertSucceeds(readUser);
        });

        it('Only authenticated user can CREATE.', async () => {
            const createByAuthenticatedUser = authenticatedUser.firestore()
                .collection('users')
                .add({ name: "authenticated user name" })

            await testing.assertSucceeds(createByAuthenticatedUser);


            const createByUnauthenticatedUser = unauthenticatedUser.firestore()
                .collection('users')
                .add({ name: "unauthenticated user name" })

            await testing.assertFails(createByUnauthenticatedUser);
        });

        it('Only authenticated user can UPDATE.', async () => {
            const updateByAuthenticatedUser = authenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .update({ name: "authenticated user name" })

            await testing.assertSucceeds(updateByAuthenticatedUser);


            const updateByUnauthenticatedUser = unauthenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .update({ name: "authenticated user name" })

            await testing.assertFails(updateByUnauthenticatedUser);
        });

        it('Nobody can DELETE.', async () => {
            const deleteByAuthenticatedUser = authenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .delete()

            await testing.assertFails(deleteByAuthenticatedUser);


            const deleteByUnauthenticatedUser = unauthenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .delete()

            await testing.assertFails(deleteByUnauthenticatedUser);
        });
    });


    describe('Testing tweets under users (users/{userId}/tweets/{tweetId}) security rule', () => {
        beforeEach(async () => {
            // Add initial data.
            await testEnv.withSecurityRulesDisabled(async context => {
                const firestoreWithoutRule = context.firestore()
                const testUserRef = firestoreWithoutRule
                    .collection('users')
                    .doc(testUserId)

                await testUserRef.set({ name: 'initial user name' })
                await testUserRef
                    .collection('tweets')
                    .doc(testUserTweetId)
                    .set({ text: 'hello, this is my tweet.' })

                authenticatedUser = testEnv.authenticatedContext(testUserId);
                unauthenticatedUser = testEnv.unauthenticatedContext();
            })
        })

        it('Unauthenticated user can READ.', async () => {
            const readUserTweet = unauthenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .collection('tweets')
                .doc(testUserTweetId)
                .get()

            await testing.assertSucceeds(readUserTweet);
        });

        it('Only authenticated user can CREATE.', async () => {
            const createByAuthenticatedUser = authenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .collection('tweets')
                .add({ text: "authenticated user tweet" })

            await testing.assertSucceeds(createByAuthenticatedUser);


            const createByUnauthenticatedUser = unauthenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .collection('tweets')
                .add({ text: "authenticated user tweet" })

            await testing.assertFails(createByUnauthenticatedUser);
        });

        it('Only authenticated user can UPDATE.', async () => {
            const updateByAuthenticatedUser = authenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .collection('tweets')
                .doc(testUserTweetId)
                .update({ text: "updated tweet." })

            await testing.assertSucceeds(updateByAuthenticatedUser);


            const updateByUnauthenticatedUser = unauthenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .collection('tweets')
                .doc(testUserTweetId)
                .update({ text: "updated tweet." })

            await testing.assertFails(updateByUnauthenticatedUser);
        });

        it('Only authenticated user can DELETE.', async () => {
            const deleteByAuthenticatedUser = authenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .collection('tweets')
                .doc(testUserTweetId)
                .delete()

            await testing.assertSucceeds(deleteByAuthenticatedUser);


            const deleteByUnauthenticatedUser = unauthenticatedUser.firestore()
                .collection('users')
                .doc(testUserId)
                .collection('tweets')
                .doc(testUserTweetId)
                .delete()

            await testing.assertFails(deleteByUnauthenticatedUser);
        });
    });
});
