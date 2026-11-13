# Safety Quest — Team Rocky Raccoon

**An AI-assisted interactive learning platform that helps children learn how to stay safe during emergencies.**

Team Rocky Raccoon's project for **HackGlobal**.

## About the Project

Safety Quest is an interactive educational platform designed to teach children about emergency preparedness through engaging, age-appropriate lessons and activities. Initially targeting students in kindergarten through fifth grade (K–5), the platform helps young learners understand and remember essential safety procedures for emergencies such as earthquakes, fires, school drills, and shelter-in-place situations.

Emergency instructions can be confusing or intimidating for young children, making safety education difficult to teach and retain. Safety Quest addresses this challenge by transforming essential safety lessons into an approachable, interactive learning experience.

Meet **Rocky Raccoon**, our friendly mascot and learning companion! Rocky guides students through lessons, answers questions, and encourages them as they learn, helping make emergency preparedness less intimidating and more engaging.

## Current Prototype Features

Our prototype introduces several features designed to make emergency preparedness education interactive and accessible.

### Interactive Learning Modules

Students can explore six educational topics:

- **Earthquake Safety:** Learn how to respond safely during an earthquake.
- **Fire Safety:** Understand essential fire prevention and response procedures.
- **School Drills:** Learn how to respond appropriately during school emergency drills.
- **Shelter-in-Place:** Understand when and why it is important to remain indoors during certain emergencies.
- **Emergency Kits:** Learn about essential supplies to include in an emergency preparedness kit.
- **Calling First Responders:** Learn when to seek urgent help, how first responders help, and how emergency numbers differ across countries. The lesson includes a starter country lookup that should be verified against official local sources.

### Ask Rocky — AI Learning Assistant

Rocky Raccoon provides a conversational learning experience where students can ask questions and explore emergency preparedness topics beyond the information covered in individual lessons.

Features include:
- Conversational responses to student questions.
- Contextual follow-up conversations.
- Age-appropriate explanations of emergency preparedness concepts.
- Encouraging responses that support continued learning.
- Prepared fallback responses when AI functionality is unavailable.

The AI integration is designed to use reliable emergency preparedness information to guide responses and reduce the risk of misleading safety instructions.

### Interactive Learning and Rewards

- Interactive quizzes and knowledge checks.
- Immediate feedback to help students understand their answers.
- Progress tracking and quest points.
- Rewards for completing educational activities.

### User Accounts and Guest Access

Safety Quest supports both guest learners and registered users.

- Guest users can access the Earthquake Ready learning module without creating an account.
- Registered users can access additional learning modules.
- Guardian-managed account creation, login, and logout through Supabase Auth.
- A learner chooses a nickname; the parent or guardian email is used for authentication and confirmation.
- The learner's nickname is shown in the interface instead of the guardian email.
- Saved learning progress for registered users through Supabase.
- Browser-based progress tracking for guest users.
- Signup prompts the parent or guardian to participate and acknowledge the privacy information.

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **Authentication and Data Storage:** Supabase
- **AI Integration:** OpenAI API
- **Configuration:** Environment variables for API credentials and service connections

Some integrations require API credentials and environment configuration before they can be used.

## Safety and Educational Responsibility

Safety Quest is intended to supplement, not replace, guidance from teachers, parents, and emergency management professionals.

### Child account privacy (prototype)

The account flow is designed so a learner uses a nickname and a parent or guardian's email address, rather than asking the learner for their own email or real name. The current prototype stores the guardian email as the Supabase Auth login address and stores the nickname in the user's profile metadata. Learning progress is associated with the authenticated account.

The signup checkbox and email confirmation are prototype safeguards; they do **not by themselves establish legally sufficient verifiable parental consent** or make the product compliant with COPPA, GDPR-K, or other child privacy laws. Before public use with children, the team must implement and review an appropriate parental notice and consent process, a clear privacy policy, data retention/deletion procedures, and any required age/region-specific controls. Do not collect children's personal information until those safeguards have been reviewed and approved. The Supabase project must also have email confirmation enabled and its database security policies configured.

Educational content should be grounded in reliable emergency preparedness resources. AI-generated responses are designed to support learning rather than independently determine emergency procedures.

## Future Development

Although Safety Quest initially focuses on K–5 students, our long-term vision is to make emergency preparedness education accessible to a wider audience.

Potential future developments include:

- Additional emergency topics, including severe weather, floods, and other natural disasters.
- Learning paths for middle school students, teenagers, and adults.
- International emergency preparedness guidance, including country-specific emergency responder contact information.
- Expanded teacher tools and classroom learning resources.
- More personalized learning experiences and adaptive practice questions.
- Additional interactive scenarios, rewards, and progression systems.

Emergency preparedness is an important life skill at every age. By making safety education more approachable and accessible, Safety Quest aims to help more people build the knowledge and confidence they need to respond appropriately during emergencies.

## Getting Started

To run the project locally:

1. Clone the repository.
2. Navigate to the project directory.
3. Review the `.env.example` file for required environment variables.
4. Configure the necessary Supabase and AI API credentials.
5. Install dependencies from the repository root with `npm install`.
6. Start the application with `npm start` (or use `npm run dev` during development).

**Note:** Some features, including authentication, saved progress, and AI-powered conversations, require appropriate service configuration. Guest learning functionality provides an alternative way to explore the prototype.

## Team Rocky Raccoon

Developed for **HackGlobal** by:

- [Tania Rivera](https://github.com/taniaisabelarivera) — @taniaisabelarivera
- [Sophia Beker](https://github.com/sophiaBeker) — @sophiaBeker
- [Valerie Guillen](https://github.com/Val1066) — @Val1066
- [Fionna Reyes](https://github.com/fionna-reyes) — @fionna-reyes
