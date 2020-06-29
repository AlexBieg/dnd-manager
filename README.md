# DnD Manager
An application for Dungeon Masters to more easily manager their games

## Overview
DnD Manager is loosley based off of the Notion notes application. For most users I would reccomend checking that out first since it is supported by an entire team. 

This application will allow you to create wiki of relations that will help you both plan and run your games.

## Pages
DnD Manager is seperated into pages. Each page contains the information for your game. There are two main types of information you can add to a page:

1. Text Content
2. Tables

### Text Content
The text content of a page is broken into blocks. Each block is draggable and can be reordered as you develop the story. Within each block there are a few different formatting types to organize content:

1. Callouts:
    1. Added using cmd+p. Important information can be placed here so that it will be more noticable.
2. Quotes:
    1. Added using cmd+q. Quotes can be placed here to remember exact phrasing for NPCs
3. Headings:
    1. Added using cmd+1, cmd+2, or cmd+3. Headings will break up the content in your pages
4. Ordered Lists:
    1. Added after pushing space after typing `1.`.
5. Unordered Lists:
    1. Added after pushing space after typing `*` or `-`.
    
There is also inline formatting using cmd+b to **bold** and cmd+i to *italicize*

Additionally there are inline linking and functional components that can be added to text content:

1. Page Links
    1. Added using `#<PAGE_NAME>` and pressing enter. This will add a clickable link to the chosen page. 
2. Entity Links
    2. Added using `#<ENTITY_NAME>` and pressing enter. An entity is a row in a table (Tables are described in more detail below). This allows you to link to a specific one. Clicking it will pull up an overview of that specific entity. This is often useful for creating a table of monsters and their attributes and linking to that from a page where a fight will occur. 
3. Dice Rolls
    1. Added by pressing space after a valid dice text (i.e. `d20`, `1d10+4`, `6d6`). Clicking this will roll those dice and display the outcome in the right hand dice roller column.
    
### Tables
A table is a database of entites that can be linked to from anywhere. Each table has an ID column that will be used to search when trying to link from somewhere else. Each cell of a table acts as a text content and thus can contain any of the above text content, including links to entities within the table. Tables can be added to a page using the menu next to each content block. Tables can be created empty or using the import CSV button. 

#### Table Columns
Each column can be renamed and reordered. A filter text box can be used to filter down large data sets. There are two kinds of filters: Includes and Exact. Includes shows all results that include the provided text. Exact only shows results that exactly match the provided text. Each table has an ID column. This column cannot be deleted, but it can be renamed and reordered. You should put the unique data in this column if you expect to be linking to this table. For example, if you have a monters table, the ID column should likely contain the monster name.

#### Table Rows
Each row can be dragged to reorder. Rows can be deleted using the menu. And Rows can be added above also using the menu.

## Future Improvements
1. Add a dropdown to page and entity linking so that users can know which item will be linked and can choose lower ranked options
2. Improve the dice rolling regular expression to better capture all dice text
3. Add better drag and drop to the pages list as it can be wonky in certain edge cases
4. Add sorting to tables. (The functionality should be super easy to add, but I'm kinda stuck an a good UI)
5. Add the ability to create custom templates for both pages and tables. This would allow users to create initative tables that fit their needs and not have to recreate it on every page. 
6. Add cell expressions to allow computed cell values. In my head it would be easiest to just allow users to write JS here, but I recognize that may not be a viable solution for non-programmers
7. Related to the above item, allow user to create inline text expressions using data from tables. I imagine this would work in a format similar to `@goblin.HP` to reference a monster's health for whatever calculations might be needed.
7. Improve table performance. Honestly this isn't too bad right now, but since I ended up implementing a virtualized-adjacent table myself there can be some lag from time to time
8. Add a back button for going back between pages
9. Add undo functionality
