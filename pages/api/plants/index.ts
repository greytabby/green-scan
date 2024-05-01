import OpenAI from 'openai';
import {
    ChatCompletionMessage,
    ChatCompletionMessageParam,
} from 'openai/resources/chat';
import plants from '../../../data/plants.json';
import { cleanEnv, str } from 'envalid';
import { NextApiRequest, NextApiResponse } from 'next';

const env = cleanEnv(process.env, {
    OPENAI_API_KEY: str({ example: 'sk...' }),
});

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

async function callFunction(
    function_call: ChatCompletionMessage.FunctionCall
): Promise<any> {
    const args = JSON.parse(function_call.arguments!);
    switch (function_call.name) {
        case 'search_plant_toxicity':
            return await search(args['scientificName']);
        default:
            throw new Error('No function found');
    }
}

// GET /api/plants
// Required fields in quety: name
export async function handle(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        // method not allowed
        return res.status(405);
    }
    const { query } = req;
    const name = query.name as string;

    const messages: ChatCompletionMessageParam[] = [
        {
            role: 'system',
            content:
                'Please provide the scientific name (Latin name) for the Japanese plant named [ユーザーが入力した植物名]. And use search_plant_toxicity function. Finnary Please give your final answer in Japanese.',
        },
        {
            role: 'user',
            content: name,
        },
    ];

    let lastMessage = {
        content: '',
    };
    while (true) {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages,
            functions: [
                {
                    name: 'search_plant_toxicity',
                    description:
                        'Search for toxicity information for the plant with scientific name.',
                    parameters: {
                        type: 'object',
                        properties: {
                            scientificName: {
                                type: 'string',
                                description: 'scientific name (Latin name)',
                            },
                        },
                        required: ['scientificName'],
                    },
                },
            ],
        });

        const message = completion.choices[0]!.message;
        messages.push(message);
        lastMessage = message;

        // If there is no function call, we're done and can exit this loop
        if (!message.function_call) {
            break;
        }

        // If there is a function call, we generate a new message with the role 'function'.
        const result = await callFunction(message.function_call);
        const newMessage = {
            role: 'function' as const,
            name: message.function_call.name!,
            content: JSON.stringify(result),
        };
        messages.push(newMessage);
    }

    res.json(lastMessage);
}

async function search(scientificName: string) {
    return plants.filter((item) => item.scentificName === scientificName);
}

export default handle;
