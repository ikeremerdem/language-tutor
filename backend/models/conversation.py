from pydantic import BaseModel


class PersonaContext(BaseModel):
    id: str
    persona_id: str
    label: str
    created_at: str


class Persona(BaseModel):
    id: str
    name: str
    description: str
    persona_prompt: str
    image_url: str
    created_at: str


class PersonaWithContexts(Persona):
    contexts: list[PersonaContext] = []


class ConversationMessage(BaseModel):
    id: str
    conversation_id: str
    role: str  # 'persona' | 'user'
    content: str
    translation: str = ''
    grammar_ok: bool | None = None
    grammar_explanation: str = ''
    grammar_corrected: str = ''
    created_at: str


class Conversation(BaseModel):
    id: str
    tutor_id: str
    user_id: str
    persona_id: str
    context_id: str | None
    persona_name: str
    created_at: str


class StartConversationRequest(BaseModel):
    persona_id: str
    context_id: str | None = None


class StartConversationResponse(BaseModel):
    conversation_id: str
    persona_name: str
    first_message: str
    first_message_translation: str


class SendMessageRequest(BaseModel):
    content: str


class SendMessageResponse(BaseModel):
    content: str
    translation: str
    grammar_ok: bool
    grammar_explanation: str
    grammar_corrected: str


# Admin CRUD models

class PersonaCreate(BaseModel):
    name: str
    description: str = ''
    persona_prompt: str = ''
    image_url: str = ''


class PersonaUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    persona_prompt: str | None = None
    image_url: str | None = None


class PersonaContextCreate(BaseModel):
    label: str
