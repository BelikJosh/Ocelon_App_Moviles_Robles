# OCELON

<p align="center">
  <img src="https://github.com/BelikJosh/Ocelon_QRancheros/blob/main/assets/images/Logo_ocelon.jpg" width="300" alt="OCELON">
</p>

## What is OCELON?

Ocelon is a solution that modernizes the parking experience through **dynamic QR codes** and **mobile payments**, eliminating physical tickets, lines, and unnecessary waiting.
It is designed to be **secure, scalable, and eco-friendly**, offering interoperability with multiple payment methods.

### **Use Cases**

- Shopping center parking
- Airports and hospitals
- Mass events
- Corporate spaces

## **System Components**

Ocelon is composed of the following modules:

- **Mobile App**: User interface ([React Native](https://reactnative.dev/docs/environment-setup) + Expo).
- **Backend API**: Stay management, QR code validation, and payments.
- **Cloud Database**: [AWS DynamoDB](https://aws.amazon.com/dynamodb/pricing/?refid=9a33b60a-429c-4f86-9a5c-bde883d6c81c) for metadata.
- **Secure Storage**: [AWS S3](https://aws.amazon.com/s3/getting-started/?nc1=h_ls) for QR codes.
- **Payment Gateway**: Integration with  [**Open Payments**](https://github.com/interledger/open-payments) for secure digital payments.

## **Architecture**

[Mobile App] <-> [JSON API] <-> [AWS DynamoDB + S3] <-> [Open Payments]

## **Benefits**

- **Fast and secure experience**: Skip the line.
- **Full interoperability**: With the use of Open Payments, it becomes compatible with banks, wallets, and cryptocurrencies.
- **Operational savings**: Paperless, less maintenance.
- **Sustainability**: Paperless, smaller carbon footprint.
- **Inclusion**: Digital options and cash payment machines.

## **Technologies**

- **Frontend**: React Native + Expo (TypeScript)
- **Backend**: AWS (DynamoDB, S3)
- **Integration**: JSON APIs
- **Payments**: Open Payments
- **Security**: TLS, tokenization, access control

## **Installation and Local Environment**

### **Requirements**
- [Node.js](https://nodejs.org/en) (recommended version in .nvmrc)
- [NVM](https://github.com/nvm-sh/nvm) for managing Node versions
- [pnpm](https://pnpm.io/es/installation) as the package manager
- [Expo CLI](https://docs.expo.dev/more/expo-cli) for mobile development
- AWS CLI configured with credentials
- Open Payments account for integration testing

### **Environment Setup**

**1. Install the correct version of Node.**
   ```bash
   nvm install
   nvm use
   ```
**2. Enable corepack and pnpm**
   ```bash
   corepack enable
   ```
**3. Install project dependencies**
   ```bash
   pnpm install
   ```
**4. Install Expo CLI globally (if not already installed)**
   ```bash
   npm install --global expo-cli
   ```
**5. Set environment variables**
   ```bash|
   cp .env.example .env
   ```
**Edit the .env file with your credentials (AWS, Open Payments, etc.)**

**6. Connection with DynamoDB and AWS**
   ```bash
   npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
   ```
**7. Data Encryption**
   ```bash
   npm install react-native-get-random-values
   ```

## **Start the app**
   ```bash
   npx expo start
   ```

## **Get a fresh project**

When you're ready, run:

```bash
npm run reset-project
```
This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## **Team**

| Name | Role |
|--------------------------------|------------------------------------------|
| Iram Aguilar Gaméz Aguilar | Project Lead & Backend Architect |
| Josue David Hernández Durón | Backend Developer & Cloud Infrastructure |
| David Antonio Rangel García | Frontend Developer |
| Alondra Rubí Valdés Mora | UX/UI Designer & QA |

## **License**

This project was developed as part of a Hackathon and is open to future collaboration.
