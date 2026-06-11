# Text Analyzer Feature

## Summary
The user will input a text (small story, song lyrics, etc.) into a text field. Then the application will convert it into an interactive text, where the user can hover over all words in the text and get detailed information about it. The information in the information window will have the English translation and a standard templated information based on the word type. Of course, these templates will differ for each language. 
For example, for Greek, the verbs will have the different stems (dependent, independent) and a table of conjugations. Similarly, for nouns their articles and forms in different cases like nominative, accusative, genitive, etc. both in singular and plural in a table. 

If you decide to use some templates and prompts specific to each language, put them into the "data" folder under the backend folder. 

## Flow
Here is the expected flow of the feature:
* The user will select the "Reading" item from the menu
* On this screen the user first selects, if he will enter the text in the target language (e.g. Greek) or in English. 
* Then the user will enter the text
* The user will press OK button.  
* The text box and button disappear and the text appears on the page (translated first if language was in English). All the words in the text are interactive. When the user hovers over a word with the mouse, the information window opens. It displays the language and word type specific templated information as specified in the summary. 

