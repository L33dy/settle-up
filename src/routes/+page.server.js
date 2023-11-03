import {users} from "$lib/stores.js";

export const actions = {
    addUser: async ({request}) => {
        const data = await request.formData();

        let userName = data.get('user-name')
    }
}