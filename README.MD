# Examples repository for [iwo Renderer](https://github.com/caboyd/iwo)

[https://caboyd.github.io/iwo-examples/index.html](https://caboyd.github.io/iwo-examples/index.html)

#### [Sphere Geometry Example](https://caboyd.github.io/iwo-examples/examples/sphere_geometry_example.html)
- Code generated sphere meshes rendered with variable number of vertical and horizontal segments  

#### [PBR Example](https://caboyd.github.io/iwo-examples/examples/pbr_example.html)
- PBR Lit spheres with HDR irradiance and specular reflective environment cube maps
   
#### More examples to come!
   
## Getting Started

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

installations of node and npm

### Installing

Download repository locally

install node modules
```
npm install
```

Run development environment  
```
npm run start
```

## Deployment

### Github pages
 
https://gist.github.com/cobyism/4730490#gistcomment-2375522

#### Pre-Setup
Make sure there is a gh-pages branch in the repository. If not then create an empty one.
Commit and push anything in master branch because it will be deleted locally

```
git checkout --orphan gh-pages
git rm --cached -r .
```
Delete all of the files then commit an empty branch
```
git commit -m "First commit" --allow-empty
git push -u origin gh-pages
```
Get the master branch back
```
git checkout master
git pull origin master
```

#### Setup

Set up a git worktree to deploy to gh-pages

```
rm -rf dist
echo "dist/" >> .gitignore
git worktree add dist gh-pages
```

#### Deploy

Run the gh-publish command

```
npm run gh-publish
```

Which just runs these commands

```
npm run build
cd dist
git add --all
git commit -m "Deploy to gh-pages"
git push origin gh-pages
cd ..
```

## Built With
* [es-dev-server](https://open-wc.org/developing/es-dev-server.html) - A web server for development without bundling.
* [gl-matrix](http://glmatrix.net/) - Math library
* [Typescript](https://www.typescriptlang.org/)
* [Rollup](https://rollupjs.org) - Bundler

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
