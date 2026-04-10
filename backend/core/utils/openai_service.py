from openai import OpenAI
from django.conf import settings
import logging


logger = logging.getLogger(__name__)


class OpenAIService:
    """
    Service class for interacting with OpenAI API.
    """
    
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
    
    def categorize_appeal(self, description: str) -> dict:
        """Categorize appeal using OpenAI"""
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": """You are an appeal categorization system.
                    Analyze the appeal and return ONLY a JSON object with:
                    {
                        "category": "one of: infrastructure, safety, healthcare, 
                                    education, environment, transport, housing, 
                                    utilities, social_services, other",
                        "priority": "low | normal | high | urgent",
                        "tags": ["tag1", "tag2"]
                    }"""
                },
                {"role": "user", "content": description}
            ],
            temperature=0.3
        )
        
        import json
        return json.loads(response.choices[0].message.content)
    
    def generate_response(self, prompt, model="gpt-3.5-turbo", max_tokens=1000, temperature=0.7):
        """
        Generate a response from OpenAI API.
        """
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant for a citizen-deputy communication platform."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            raise e
    
    def generate_completion(self, prompt, model="text-davinci-003", max_tokens=1000, temperature=0.7):
        """
        Generate a text completion using the legacy completions API.
        """
        try:
            response = openai.Completion.create(
                engine=model,
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return response.choices[0].text.strip()
        except Exception as e:
            logger.error(f"Error calling OpenAI Completions API: {str(e)}")
            raise e
    
    def embed_text(self, text, model="text-embedding-ada-002"):
        """
        Generate embeddings for text.
        """
        try:
            response = openai.Embedding.create(
                input=text,
                model=model
            )
            
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise e
    
    def moderate_content(self, content):
        """
        Moderate content using OpenAI's moderation API.
        """
        try:
            response = openai.Moderation.create(input=content)
            return response.results[0].flagged
        except Exception as e:
            logger.error(f"Error moderating content: {str(e)}")
            raise e