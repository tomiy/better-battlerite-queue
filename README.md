## Better Battlerite Queue

<a name="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
<h1 align="center">Better Battlerite Queue</h1>
  <p align="center">
    A discord bot to organize private games for <a href="https://arena.battlerite.com/">Battlerite Arena</a>.
    <br />
    <a href="https://github.com/tomiy/better-battlerite-queue/issues">Report Bug</a>
    ·
    <a href="https://github.com/tomiy/better-battlerite-queue/issues">Request Feature</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

A discord bot to organize private games for <a href="https://arena.battlerite.com/">Battlerite Arena</a>.

Features a queue with regions, a draft & a match report system.

Tracks players ratings and creates balanced matches.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these steps.

### Prerequisites

- NPM

### Installation

1. Clone the repo
    ```sh
    git clone https://github.com/tomiy/better-battlerite-queue.git
    ```
2. Install NPM packages
    ```sh
    npm install
    ```
3. Configure .env with the bot's info

4. Migrate the database
    ```sh
    npm run migrate
    ```
5. Start the bot
    ```sh
    npm run dev
    ```
    <p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

The bot auto-syncs guilds, channels, roles & members between discord servers and the internal db to ensure minimal required setup: just add it to the server and launch the queue!

A `Bot Moderator` role will be created automatically. The bot recognizes this role as authorized for admin commands.

Bot Moderators will need to `/launch` the queue whenever the bot (re)starts to create the queue options.

Players will need to `/register` with an in game username and enable at least one region to queue.

Players can edit their `/profile` at any time.

During the draft, team captains can choose a champions to pick or ban from the lists available through the category buttons.

During the team's turn, if the captain is unresponsive, other team members may claim the captain role after a 1 minute timeout.

After the draft, players may report the match's outcome by voting for the option with the buttons provided.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->

## Roadmap

TODO:

- Drop during draft
- Seasons
- Champ & Map modals to edit restrictions & weights
- User profiles (w/ graphs: **low prio**)
- Leaderboards
- Manage draft sequences

MAYBE:

- Player draft
- Buttons instead of commands for most stuff
- Poll queue instead of Event driven (prevents match collisions but obligatory wait times)

See the [open issues](https://github.com/tomiy/better-battlerite-queue/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## License

Distributed under the GPL-3.0 License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Tomiy - [@**tomiy**](https://twitter.com/__tomiy__)

Project Link: [https://github.com/tomiy/better-battlerite-queue](https://github.com/tomiy/better-battlerite-queue)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

[Ehri/Xeyth](https://github.com/Xeythhhh) and anyone who has worked on the now unmaintained [BCL](https://github.com/Xeythhhh/Battlerite-Community-League) bot for their huge kickstart help and inspiration.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/tomiy/better-battlerite-queue.svg?style=for-the-badge
[contributors-url]: https://github.com/tomiy/better-battlerite-queue/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/tomiy/better-battlerite-queue.svg?style=for-the-badge
[forks-url]: https://github.com/tomiy/better-battlerite-queue/network/members
[stars-shield]: https://img.shields.io/github/stars/tomiy/better-battlerite-queue.svg?style=for-the-badge
[stars-url]: https://github.com/tomiy/better-battlerite-queue/stargazers
[issues-shield]: https://img.shields.io/github/issues/tomiy/better-battlerite-queue.svg?style=for-the-badge
[issues-url]: https://github.com/tomiy/better-battlerite-queue/issues
[license-shield]: https://img.shields.io/github/license/tomiy/better-battlerite-queue.svg?style=for-the-badge
[license-url]: https://github.com/tomiy/better-battlerite-queue/blob/master/LICENSE.txt
