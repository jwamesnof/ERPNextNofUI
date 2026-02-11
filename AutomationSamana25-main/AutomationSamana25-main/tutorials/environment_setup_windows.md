# Environment Setup

## Step I: Command-line Terminal Environment


During the course, you'll build and manage apps using a Unix-like command-line environment.

The terminal will be your best friend - you'll use it to run commands, troubleshoot issues, and interact with servers.

On Windows, we’ll use Git Bash, which provides a lightweight Linux-style terminal without virtual machines, or extra system complexity.

#### Install Git Bash

1. Download Git for Windows:
   https://git-scm.com/download/win
2. Run the installer:
   - Keep **default options**
   - When asked about the terminal, choose **Git Bash**
   - When asked about `PATH`, choose **Git from the command line and also from 3rd-party software**
3. After installation, open **Git Bash**
   (Right-click anywhere → Open Git Bash here, or search for Git Bash)

You’ll use Git Bash for all terminal commands in this course.


## Step II: Python Interpreter

We'll be using **Python** as the primary programming language, version **3.10 or higher**. 

1. [Download Python](https://www.python.org/downloads/) (version 3.10 or higher)
2. Run the installer
   - **Important**: Check the box that says **"Add Python to PATH"** during installation
3. Verify the installation by opening Git Bash and running:

```bash
python --version
pip --version
```

You should see Python 3.10 or higher.

## Step III: Set up the GitHub project repository for the InvParser app

It's time to get the code base of the project you'll be working on. This is probably what software engineers do on their first day at work. 

This project is called **InvParser** and it’s a Python-based REST API that parses invoices and extracts key information using Oracle Cloud AI services.

We’ve prepared a **GitHub repository** with all the starter code you’ll need.
You’ll create your own copy of it, that way, you can push your own code and progress without affecting the original repository.

1. Open the project template: https://github.com/alonitac/InvParserSamana.
2. Click the green **Use this template** button.
3. Choose **Create a new repository**.
4. Give your repository a meaningful name (e.g. `InvParserSamana`)
5. Click **Create repository**.

You’ve just created your own GitHub project. 
Now we’ll use Git to bring that repository into your local environment.

1. Copy the URL of your new repository (click the green **Code** button → **HTTPS**).
2. In your Git Bash terminal, run:

   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   ```
   
   Replace the URL above with the one you copied.
3. Move into your project directory:

   ```bash
   cd YOUR-REPO-NAME
   ```
   
You’re in! The code is now on your machine and you’re ready to start building.

## Step IV: IDE (Integrated Development Environment)

The next and last step is to set up an **Integrated Development Environment (IDE)**.

You'll extensively use the IDE to write, run, and debug your code.

While you are free to use any IDE you like, we recommend using either VS Code or PyCharm.

#### Visual Studio Code (VS Code)

VS Code is lightweight, fast, and works well on Linux, Windows, and MacOS.


**As a Windows user, you should install VS Code on the Windows side (not in WSL)**.


- [Download and install VS Code](https://code.visualstudio.com/Download), follow default set up settings.

- Install the [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) and  [Python Debugger](https://marketplace.visualstudio.com/items?itemName=ms-python.debugpy).
   These extensions provide Python language support and debugging capabilities.
- Open VS Code
- Open your project folder:
  - **File** → **Open Folder**
  - Select your cloned repository directory
- Open the built-in terminal in VS Code:
  - **Terminal** → **New Terminal**
  - Select Git Bash if it’s not the default


> [!TIP]
> You are highly encouraged to turn on **Auto Save** mode by **File** > **Auto Save** toggle. 
> This automatically save edited files after a delay.


# Bravo 👏

