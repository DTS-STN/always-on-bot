# always-on-bot

## Summary

Bot Framework v4 application.

This bot has been created using [Bot Framework](https://dev.botframework.com). The project is building a chatbot to help OAS user to understand and know their pension information.

- **Front-End app**: The [Virtual Assistant Web App code repo is located here](https://github.com/DTS-STN/Oas-Unblock-Web-App).
- **Demo**: [OAS Unblock bot is online here](https://oas-unblock-web-app-main.bdm-dev.dts-stn.com/).

## Build Status

<a href="https://teamcity.dts-stn.com/viewType.html?buildTypeId=OasUnlockBot_DeployBdmDev&guest=1" >
<img src="https://teamcity.dts-stn.com/app/rest/builds/buildType:(id:5076)/statusIcon"/>
</a>

## Table of Contents

- [oas-unblock-Bot](#always-on-bot)
  - [Summary](#summary)
  - [Build Status](#build-status)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#technology-stack)
  - [Installation](#installation)
  - [Onboarding](#onboarding)
  - [Pipeline Integration](#pipeline-integration)
  - [Config Changelog](#config-changelog)

## Getting Started

### Installation

- Clone this bot's code repository to your local machine

```bash
git clone https://github.com/DTS-STN/always-on-bot
```

or

```bash
git clone git@github.com:DTS-STN/always-on-bot.git
```

### Onboarding

See the Virtual Assistant Bot Framework [Onboarding wiki](https://github.com/DTS-STN/Virtual-Assistant-Bot-Framework/wiki/5.-Developer-Onboarding) for details on:

- [Getting started](https://github.com/DTS-STN/Virtual-Assistant-Bot-Framework/wiki/5.-Developer-Onboarding#getting-started)
- [Training LUIS](https://github.com/DTS-STN/Virtual-Assistant-Bot-Framework/wiki/6.-LUIS)
- [Adaptive Cards](https://github.com/DTS-STN/Virtual-Assistant-Bot-Framework/wiki/7.-Adaptive-Cards)
- [Testing](https://github.com/DTS-STN/Virtual-Assistant-Bot-Framework/wiki/5.-Developer-Onboarding#testing)
- [Pipeline integration](https://github.com/DTS-STN/Virtual-Assistant-Bot-Framework/wiki/8.-DevOps-&-Publishing)
- [Virtual Assistant Web Apps](https://github.com/DTS-STN/Virtual-Assistant-Bot-Framework/wiki/8.-Virtual-Assistant-Web-App)

## Pipeline Integration

### TeamCity

This application leverages GitHub actions and [TeamCity Pipelines](https://teamcity.dts-stn.com/ 'TeamCity Login') for performing pre-merge regression testing. On PR creation or update, the Pipelines will run the entire API test collection, as well as the integration tests. The GitHub action will run testing and build docker container for application.

#### Terraform

[Terraform](https://www.terraform.io/intro/index.html 'Terraform intro') is an infrastructure as code (IaC) tool that allows you to build, change, and version infrastructure safely and efficiently.

Always On Bot [Terraform is configured here](https://teamcity.dts-stn.com/buildConfiguration/OasUnlockBot_Terraform_TerraformAlwaysOnBot#all-projects 'Always On Bot Terraform profile').

## Config Changelog

- 2021/12/21: les.lakewood@hrsdc-rhdcc.gc.ca - Initial Draft based on oas-unblock-bot
- 2022/01/07: gurunadham.buddepu@ca.ey.com - Always-on bot first draft pushed
