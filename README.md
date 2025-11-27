## Better Private Lobbies

<a name="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
<h1 align="center">Better Private Lobbies</h1>
  <p align="center">
    A discord bot to organize private lobbies for pvp games.
    <br />
    <a href="https://github.com/tomiy/better-private-lobbies/issues">Report Bug</a>
    ·
    <a href="https://github.com/tomiy/better-private-lobbies/issues">Request Feature</a>
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

A discord bot to organize private lobbies for pvp games.

Originally designed for <a href="https://arena.battlerite.com/">Battlerite Arena</a> but can be used for any game with characters and terrains.

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
    git clone https://github.com/tomiy/better-private-lobbies.git
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

The bot auto-syncs guilds, channels, roles & members between discord servers and the internal db to ensure minimal required setup.

A `Bot Moderator` role will be created automatically. The bot recognizes this role as authorized for admin commands.

Moderators will need to create game modes for one of the supported games before matches or queues can be made.

Players will need to `/register` with an in game username and enable at least one region to queue.

Players can edit their `/profile` at any time.

During the draft, team captains can choose players, terrains or characters to pick or ban from the lists available.

During the team's turn, if the captain is unresponsive, other team members may claim the captain role after a 1-minute timeout.

After the draft, players may report the match's outcome by voting for the option from the list provided.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ROADMAP -->

## Roadmap

TODO:

- Implement & test player & terrain draft
- Seasons
- User profiles w/ graphs: **low priority**
- Leaderboards

MAYBE:

- Poll queue instead of Event driven (prevents match collisions but obligatory wait times)

See the [open issues](https://github.com/tomiy/better-private-lobbies/issues) for a full list of proposed features (and known issues).

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

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

Tomiy - [@**tomiy**](https://twitter.com/__tomiy__)

Project Link: [https://github.com/tomiy/better-private-lobbies](https://github.com/tomiy/better-private-lobbies)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

[Ehri/Xeyth](https://github.com/Xeythhhh) and anyone who has worked on the Battlerite Community League bot for their huge kickstart help and inspiration.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/tomiy/better-private-lobbies.svg?style=for-the-badge

[contributors-url]: https://github.com/tomiy/better-private-lobbies/graphs/contributors

[forks-shield]: https://img.shields.io/github/forks/tomiy/better-private-lobbies.svg?style=for-the-badge

[forks-url]: https://github.com/tomiy/better-private-lobbies/network/members

[stars-shield]: https://img.shields.io/github/stars/tomiy/better-private-lobbies.svg?style=for-the-badge

[stars-url]: https://github.com/tomiy/better-private-lobbies/stargazers

[issues-shield]: https://img.shields.io/github/issues/tomiy/better-private-lobbies.svg?style=for-the-badge

[issues-url]: https://github.com/tomiy/better-private-lobbies/issues

[license-shield]: https://img.shields.io/github/license/tomiy/better-private-lobbies.svg?style=for-the-badge

[license-url]: https://github.com/tomiy/better-private-lobbies/blob/main/LICENSE
