import type {FastifyInstance} from "fastify";
const users:{
   username : string;
   email : string;
   password : string; 
}[]=[];

export async function registerRoutes(app: FastifyInstance) {
    app.post("/register", async (request, reply) => {
        console.log(request.body);
        const { username, email, password } = request.body as { username: string; email: string; password: string };

        // Check if user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return reply.status(400).send({ error: "User already exists" });
        }

        // Create new user
        const newUser = { username, email, password };
        users.push(newUser);

        return reply.status(201).send({ message: "User registered successfully" });
    });
}