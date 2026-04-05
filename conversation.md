# Conversation Feature

This feature will be a new top menu item, like the word quiz, sentence quiz. 

Mainly, it will provide different personas to chat with like waiter, doctor, nurse, teacher, seller etc. Then you will select one of the contexts like "Ordering food", "Paying bill" or "General". 

After the persona and the context are selected, a chat starts. Always the persona starts the conversation with a message from this persona, considering the context. At the beginning, the LLM should assign a real name to use considering the persona and the language of the tutor. 

Then the user enters his/her response. Then the persona replies like a chat bot, user responds, etc. 

The persona should try to talk as much as possible using the vocabulary of the user, if the context of the conversation allows. But should not talk nonsense just to use these words. 

For this, we will need an object called 'persona'. It will have following attributes:

* Persona Name: Persona Name visible to user, like "Waiter"
* Description: Details the persona, visible to user. "Friendly waiter at your favorite restaurant, you can chat with him/her to order food, give feedback, pay, etc"
* Persona prompt: The prompt for the LLM describing this persona
* Persona Contexts: A list of predefined contexts to select from, which will be fed to the LLM to detail the conversation along with the persona prompt. 
* Image: To make it visual, a picture of the persona

Store everything in the DB. Create a simple persona management page for the admin. 
