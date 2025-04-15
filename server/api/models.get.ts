interface ModelResult {
  success: boolean;
  result: {
    id: string;
    name: string;
    description: string;
    task: {
      id: string;
      name: string;
      description: string;
    };
    propertys: {
      property_id: string;
      value: string;
    }[];
  }[];
}

export default defineCachedEventHandler(
  async () => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const userToken = process.env.CLOUDFLARE_API_TOKEN;
    try {
      const response = await $fetch<ModelResult>(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/models/search?task=text generation`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.result.map((model) => model.name);
    } catch (error) {
      console.error('Error fetching models:', error);
    }

    return [];
  },
  {
    maxAge: 24 * 60 * 60, // 1 day
  }
);
